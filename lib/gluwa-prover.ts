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

        // Now that we have the block number, we can setup the chain info provider
        const info = new chainInfo.PrecompileChainInfoProvider(creditcoinRpc);

        console.log(`[PROVER] Checking attestation for block ${blockNumber} on chain ${chainKey}...`);

        const latest = await info.getLatestAttestedHeightAndHash(chainKey);
        console.log(`[PROVER] Hub Latest Attested: ${latest.height} (Exists: ${latest.exists})`);

        const isAttested = latest.exists && latest.height >= blockNumber;

        if (!isAttested) {
            console.log(`[PROVER] 🛑 Block ${blockNumber} NOT ATTESTED. Throwing BLOCK_NOT_ATTESTED.`);
            throw new Error("BLOCK_NOT_ATTESTED");
        }

        console.log(`[PROVER] ✅ Block ${blockNumber} is attested! Proceeding to Prover API...`);

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
            throw error;
        }
    } catch (e: any) {
        console.error(`[PROVER] Outer fail: ${e.message}`);
        console.timeEnd(`proof-gen-${txHash}`);
        throw e;
    }
}
