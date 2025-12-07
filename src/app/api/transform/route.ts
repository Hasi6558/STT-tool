import {NextRequest,NextResponse} from "next/server";
import OpenAI from "openai";
import {CleanUpPrompt,EnhancePrompt, BookPrompt} from '@/lib/prompts'

const client = new OpenAI({apiKey: process.env.OPENAI_API_KEY});
export async function POST(req:NextRequest){
    const {text, type}=await req.json();

    if (!text || !type) {
        return NextResponse.json(
            {error: 'Missing text or type'},
            {status: 400}
        );
    }
        const userInputText = text ? text : '';
        let prompt = '';
        switch (type) {
            case 'clean':
                prompt += CleanUpPrompt;
                break;
            case 'enhance':
                prompt += EnhancePrompt;
                break;
            case 'book':
                prompt += BookPrompt;
                break;
            default: {
                return NextResponse.json({error: 'Invalid type'}, {status: 400});
            }
        }

        const completion = await client.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {role:'system', content: prompt},
                {role:'user',content:userInputText},
            ],
        });

        return NextResponse.json({
            result:completion.choices[0].message.content,
        });

}
