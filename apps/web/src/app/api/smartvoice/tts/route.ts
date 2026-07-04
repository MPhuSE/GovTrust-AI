import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json({ error: 'Missing text' }, { status: 400 });
    }

    const response = await axios.post('https://api.idg.vnpt.vn/tts-service/v2/standard', 
      {
        text,
        model: 'news',
        region: 'female_north',
        speed: 1,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': (process.env.VNPT_SMARTVOICE_ACCESS_TOKEN || '').trim(),
          'Token-id': (process.env.VNPT_SMARTVOICE_TOKEN_ID || '').trim(),
          'Token-key': (process.env.VNPT_SMARTVOICE_TOKEN_KEY || '').trim(),
        },
      }
    );

    const data = response.data;
    
    // Extract audio_link
    if (data.object?.playlist?.[0]?.audio_link) {
      return NextResponse.json({ audio_link: data.object.playlist[0].audio_link });
    } else {
      console.error('No audio link in response:', data);
      return NextResponse.json({ error: 'No audio link found in VNPT response', details: data }, { status: 500 });
    }
  } catch (error: any) {
    const errData = error.response?.data || error.message;
    console.error('TTS Route Error:', errData);
    return NextResponse.json({ error: typeof errData === 'string' ? errData : JSON.stringify(errData) }, { status: error.response?.status || 500 });
  }
}
