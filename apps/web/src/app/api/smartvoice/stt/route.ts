import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import axios from 'axios';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get('audioFile') as Blob | null;

    if (!audioFile) {
      return NextResponse.json({ error: 'Missing audioFile' }, { status: 400 });
    }

    const clientSession = crypto.randomUUID();
    const vnptFormData = new FormData();
    vnptFormData.append('audioFile', audioFile, 'recording.webm');
    vnptFormData.append('clientSession', clientSession);
    vnptFormData.append('maxAlternatives', '1');
    vnptFormData.append('audioChannelCount', '1');
    vnptFormData.append('enableWordTimeOffsets', 'false');
    vnptFormData.append('enableAutomaticPunctuation', 'false');

    const accessToken = (process.env.VNPT_SMARTVOICE_STT_ACCESS_TOKEN || '').trim();
    const tokenId = (process.env.VNPT_SMARTVOICE_STT_TOKEN_ID || '').trim();
    const tokenKey = (process.env.VNPT_SMARTVOICE_STT_TOKEN_KEY || '').trim();

    console.log('--- STT TOKENS ---');
    console.log('ID:', tokenId);
    console.log('KEY:', tokenKey);
    console.log('------------------');

    const response = await fetch('https://api.idg.vnpt.vn/stt-service/v1/grpc/standard', {
      method: 'POST',
      headers: {
        'Authorization': accessToken,
        'Token-id': tokenId,
        'Token-key': tokenKey,
      },
      body: vnptFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('VNPT STT Error:', errorText);
      return NextResponse.json({ error: errorText }, { status: response.status });
    }

    const data = await response.json();
    
    // Extract transcript
    if (data.object?.results?.[0]?.alternatives?.[0]?.transcript) {
      return NextResponse.json({ transcript: data.object.results[0].alternatives[0].transcript });
    } else {
      return NextResponse.json({ transcript: '' });
    }
  } catch (error: any) {
    console.error('STT Route Error:', error.message || error);
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
}
