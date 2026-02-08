import { JsonRpcApiProvider } from 'ethers';
import { proofGenerator, chainInfo } from '@gluwa/cc-next-query-builder';

/**
 * Tries to generate a proof for the given transaction hash on the specified chain.
 */
export async function generateProofFor(
    txHash: string,
    chainKey: number,
    proofServerUrl: string,
    creditcoinRpc: JsonRpcApiProvider,
    sourceChainRpc: JsonRpcApiProvider
): Promise<proofGenerator.ProofGenerationResult> {
    console.time(`proof-gen-${txHash}`);
    console.log(`[PROVER] Starting proof generation for ${txHash} on chain ${chainKey}`);
    try {

        // First, we need to ensure that the transaction exists on the source chain
        const transaction = await sourceChainRpc.getTransaction(txHash);
        if (!transaction) {
            throw new Error(`Transaction ${txHash} does not exist on source chain`);
        }

        // Next, we need to ensure that the block is mined
        const blockNumber = transaction.blockNumber;
        if (!blockNumber) {
            throw new Error(`Transaction ${txHash} is not yet mined on source chain`);
        }

        console.log(`[PROVER] Transaction ${txHash} found in block ${blockNumber}`);

        // Now that we have the block number, we can setup the chain info provider to await for its attestation
        const info = new chainInfo.PrecompileChainInfoProvider(creditcoinRpc);

        console.log(`[PROVER] Waiting for block ${blockNumber} attestation on Creditcoin...`);

        // We wait for at most 5 minutes for the attestation to be available
        // The client (API route) will likely timeout if this takes too long.
        // Ideally this should be polled by the client, but for simplicity in "End-to-End Test" we try to wait.
        // If the block is already attested (old tx), this returns quickly.
        await info.waitUntilHeightAttested(chainKey, blockNumber, 5_000, 300_000);

        console.log(`[PROVER] Block ${blockNumber} attested! Generating proof...`);

        // We can now proceed to generate the proof using the prover API
        const proofGenApi = new proofGenerator.api.ProverAPIProofGenerator(chainKey, proofServerUrl);

        try {
            console.log(`[PROVER] Calling ProofAPI at ${proofServerUrl}...`);
            const proof = await proofGenApi.generateProof(txHash);
            console.log('[PROVER] Proof generation successful!');
            console.timeEnd(`proof-gen-${txHash}`);
            return proof;
        } catch (error: any) {
            console.error('[PROVER] Error during proof generation: ', error?.message || error);
            console.timeEnd(`proof-gen-${txHash}`);
            if (error?.message?.includes('attestation')) {
                throw new Error("Block not attested yet. Please wait.");
            }
            throw error;
        }
    } catch (e: any) {
        console.error(`[PROVER] Outer fail: ${e.message}`);
        console.timeEnd(`proof-gen-${txHash}`);
        throw e;
    }
}
