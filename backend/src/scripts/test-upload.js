import dotenv from 'dotenv';
import fs from 'fs';
import { uploadToCloudinary } from '../utils/cloudinary.js';

dotenv.config();

const testUpload = async () => {
    // Note: The actual path from previous step is needed
    // I will replace it with the actual path
    const filePath = 'C:/Users/kanda/.gemini/antigravity/brain/80e98017-72d3-4f48-a7a1-927edbd52b0d/premium_celebration_cake_1775066825848.png';
    
    console.log('🖼️ Starting Cloudinary Test Upload...');
    console.log(`📂 Reading file: ${filePath}`);
    
    try {
        const fileBase64 = fs.readFileSync(filePath, { encoding: 'base64' });
        const dataUrl = `data:image/png;base64,${fileBase64}`;
        
        console.log('☁️ Sending to Cloudinary (Folder: friends-memories/test)...');
        const url = await uploadToCloudinary(dataUrl, 'test');
        
        console.log('✅ SUCCESS!');
        console.log(`🔗 Live URL: ${url}`);
        console.log('\n🌟 Check your Cloudinary Dashboard at https://cloudinary.com/console/media_library/folders/friends-memories/test');
    } catch (error) {
        console.error('❌ Upload Failed:', error.message);
    }
    process.exit();
};

testUpload();
