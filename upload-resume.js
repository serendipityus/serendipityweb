import { createClient } from '@supabase/supabase-js';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  try {
    const origin = req.headers.origin || '';

    if (!origin.includes('serendipityus.com')) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const form = new formidable.IncomingForm();

    form.parse(req, async (err, fields, files) => {
      if (err) return res.status(500).json({ error: 'Parse error' });

      const file = files.resume;

      if (!file) {
        return res.status(400).json({ error: 'No file' });
      }

      const buffer = fs.readFileSync(file.filepath);
      const fileName = `${Date.now()}-${file.originalFilename}`;

      const { error } = await supabase.storage
        .from('Resumes')
        .upload(fileName, buffer, {
          contentType: file.mimetype,
        });

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      const { data } = supabase.storage
        .from('Resumes')
        .getPublicUrl(fileName);

      return res.status(200).json({
        url: data.publicUrl,
      });
    });

  } catch (e) {
    return res.status(500).json({ error: 'Server error' });
  }
}
