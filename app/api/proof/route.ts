import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import { generateProofFor } from "@/lib/gluwa-prover";
import { NETWORKS } from "@/lib/contracts";

const PROVER_API_URL = "https://proof-gen-api.usc-testnet2.creditcoin.network";

// DB Access
// Dynamic import to avoid client-side bundling issues if referenced elsewhere
// DB Access
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { txHash, chainKey, userAddress, amount, tokenAddress, hubTxHash, status } = body;

        if (!txHash) return NextResponse.json({ error: "Missing txHash" }, { status: 400 });

        if (hubTxHash) {
            const { error: updateError } = await supabase
                .from('deposits')
                .update({
                    hub_tx_hash: hubTxHash,
                    status: status || 'Synced',
                    updated_at: new Date().toISOString()
                })
                .eq('tx_hash', txHash);

            if (updateError) {
                if (updateError.code === 'PGRST204') {
                    console.warn("[Supabase] hub_tx_hash column missing. Please run: ALTER TABLE deposits ADD COLUMN hub_tx_hash TEXT;");
                    return NextResponse.json({ success: false, warning: "Column missing in DB" });
                }
                throw updateError;
            }
            return NextResponse.json({ success: true, message: "Hub hash updated" });
        }

        // Otherwise, insert/upsert new deposit
        const { error } = await supabase
            .from('deposits')
            .upsert({
                tx_hash: txHash,
                chain_key: Number(chainKey) || 1,
                user_address: userAddress,
                amount: amount,
                token_address: tokenAddress,
                status: 'PENDING',
                created_at: new Date().toISOString()
            }, { onConflict: 'tx_hash' });

        if (error) throw error;

        console.log(`[Supabase] Saved deposit pending proof: ${txHash}`);
        return NextResponse.json({ success: true, message: "Deposit queued" });
    } catch (e: any) {
        console.error("DB Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const txHash = searchParams.get("txHash");
    const chainKeyParam = searchParams.get("chainKey");

    if (!txHash) {
        return NextResponse.json({ error: "Missing txHash" }, { status: 400 });
    }

    console.log(`[API/PROOF] GET request for ${txHash} on chain ${chainKeyParam}`);

    let chainKey = chainKeyParam ? parseInt(chainKeyParam, 10) : 1; // Default to Sepolia (1)

    // Map Standard Chain IDs to Prover Keys
    if (chainKey === 11155111) chainKey = 1; // Sepolia

    // Handle Localnet (Mock Proof)
    if (chainKey === 1337) {
        console.log("[PROOF-API] Generating Mock Proof for Localnet/Ganache...");
        // Return dummy data that matches what EvmV1Decoder expects for Mocks
        // In local/mock setup, usually verifyAndEmit is mocked or accepts simple data
        // We return a structure compatible with our frontend expectations
        return NextResponse.json({
            chainKey,
            headerNumber: 1, // Mock block
            merkleProof: {
                root: "0x" + "0".repeat(64),
                siblings: []
            },
            continuityProof: {
                lowerEndpointDigest: "0x" + "0".repeat(64),
                roots: ["0x" + "0".repeat(64)]
            },
            txBytes: "0x" // Mock transaction bytes
        });
    }

    // Handle Real Proofs (Sepolia)
    // For Hedera, we might not have Prover support yet, but we'll try if chainKey is correct.
    // Assuming chainKey 1 is Sepolia on USC Testnet.

    // Choose Source RPC
    let sourceRpcUrl = NETWORKS.SEPOLIA.rpc;

    if (chainKey === 296) { // Hedera Chain ID
        console.warn("[PROOF-API] Hedera Proof Generation requested. Use '1337' for Mock if Prover unavailable.");
        // TODO: Update when Hedera Prover is live at 'https://proof-gen-api.hedera.creditcoin.network'
        // For now, we try to use the Hedera RPC but likely the Prover URL needs to change.
        sourceRpcUrl = NETWORKS.HEDERA.rpc;
    }

    try {
        // Check Supabase first
        const { data: existing, error: dbError } = await supabase
            .from('deposits')
            .select('*')
            .eq('tx_hash', txHash)
            .single();

        if (existing?.proof) {
            console.log(`[Supabase] Returning cached proof for ${txHash}`);
            return NextResponse.json(existing.proof);
        }

        console.log(`[PROOF-API] Requesting proof for ${txHash} on chain ${chainKey} from ${PROVER_API_URL}`);

        const ccProvider = new ethers.JsonRpcProvider(NETWORKS.USC.rpc);
        const sourceProvider = new ethers.JsonRpcProvider(sourceRpcUrl);

        // Call Gluwa Prover
        const proof = await generateProofFor(
            txHash,
            chainKey,
            PROVER_API_URL,
            ccProvider,
            sourceProvider
        );

        // Save to Supabase
        await supabase
            .from('deposits')
            .update({
                status: 'ProofGenerated',
                proof: proof, // Supabase JSONB column handles object directly
                updated_at: new Date().toISOString()
            })
            .eq('tx_hash', txHash);

        console.log(`[PROOF-API] Sending proof response for ${txHash}`);
        return NextResponse.json(proof);
    } catch (error: any) {
        console.error("[PROOF-API] Error:", error.message);

        if (error.message === "BLOCK_NOT_ATTESTED") {
            // Update status in DB so the real-time monitor shows it
            await supabase
                .from('deposits')
                .update({ status: 'WaitingAttestation' })
                .eq('tx_hash', txHash);

            return NextResponse.json({
                status: "WAITING_ATTESTATION",
                message: "Source block not yet attested by Creditcoin validators. This can take 10-15 minutes."
            });
        }

        return NextResponse.json(
            { error: error.message || "Failed to generate proof" },
            { status: 500 }
        );
    }
}
