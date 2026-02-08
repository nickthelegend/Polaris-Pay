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
        const proof = await proofGenApi.generateProof(txHash);
        console.log('[PROVER] Proof generation successful!');
        return proof;
    } catch (error) {
        console.error('[PROVER] Error during proof generation: ', error);
        throw error;
    }
}
