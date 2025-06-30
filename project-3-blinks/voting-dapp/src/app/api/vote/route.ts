import * as anchor from '@coral-xyz/anchor';
import { ActionGetResponse, ActionPostRequest, ACTIONS_CORS_HEADERS, createPostResponse } from '@solana/actions';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { Voting } from '../../../../anchor/target/types/voting';

const IDL = require('../../../../anchor/target/idl/voting.json');
export const OPTIONS = GET;

export async function GET() {
    const actionMetaData: ActionGetResponse = {
        icon: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTzgXRvw64gI2OU1usToJyq8dTH5eymNQnJew&s",
        title: "Choose your favorite color",
        description: "Choose your favorite color, red or blue?",
        label: "Vote",
        links:
        {
            actions: [
                {
                    label: "Vote Red",
                    href: "/api/vote?candidate=red",
                },
                {
                    label: "Vote Blue",
                    href: "/api/vote?candidate=blue",
                }
            ]       
        }
    };

    return Response.json(actionMetaData, { headers: ACTIONS_CORS_HEADERS });
}

export async function POST(request: Request) {
    const { searchParams } = new URL(request.url);
    const candidate = searchParams.get("candidate");

    if (!candidate || (candidate !== "red" && candidate !== "blue")) {
        return Response.json({ error: "Invalid candidate" }, { status: 400, headers: ACTIONS_CORS_HEADERS });
    }

    // Here you would typically handle the vote, e.g., store it in a database
    console.log(`Vote received for: ${candidate}`);

    // return Response.json({ message: `Thank you for voting for ${candidate}!` }, { headers: ACTIONS_CORS_HEADERS });

    const connection = new Connection("http://127.0.0.1:8899", "confirmed");

    const program: anchor.Program<Voting> = new anchor.Program(
        IDL,
        { connection },
    )

    const body: ActionPostRequest = await request.json();
    let voter;

    try {
        voter = new PublicKey(body.account);
    } catch (error) {
        return Response.json({ error: "Invalid voter account" }, { status: 400, headers: ACTIONS_CORS_HEADERS });
    }

    const instruction = await program.methods.vote(
        candidate as string, new anchor.BN(1), // Assuming poll_id is 1
    ).accounts({
        signer: voter,
    }).instruction();

    const blockhash = await connection.getLatestBlockhash();

    const transaction = new Transaction({
        feePayer: voter,
        blockhash: blockhash.blockhash,
        lastValidBlockHeight: blockhash.lastValidBlockHeight,
    }).add(instruction);

    const response = await createPostResponse({
        fields: {
            transaction: transaction,
        }
    });

    return Response.json(response, { headers: ACTIONS_CORS_HEADERS });

}