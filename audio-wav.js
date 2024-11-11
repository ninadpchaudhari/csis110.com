import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
// const { FFmpeg } = FFmpegWASM;
// const { fetchFile } = FFmpegUtil;
let ffmpeg = null;

let audioFile = null;
const fileInput = document.getElementById('fileInput');
const info = document.getElementById('info');
const downloadBtn = document.getElementById('downloadBtn');
const message = document.getElementById('message');
fileInput.addEventListener('change', async (e) => {
    audioFile = e.target.files[0];

    if (audioFile) {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const arrayBuffer = await audioFile.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        info.innerHTML = `
                    <p>File name: ${audioFile.name}</p>
                    <p>File size: ${(audioFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    <p>File type: ${audioFile.type}</p>
                    <!-- <p>Sample rate: ${audioBuffer.sampleRate} Hz</p> 
                        This needs work as AudioContext always uses 44kHz as sampling rate!
                        Need some other way to get that metadata.
                        music-metadata using webpack or something.
                        -->
                    <p>Number of channels: ${audioBuffer.numberOfChannels}</p>
                    <p>Duration: ${(audioBuffer.duration).toFixed(2)} seconds</p>
                `;
        downloadBtn.disabled = false;
    }
});

downloadBtn.addEventListener('click', async () => {

    if (!audioFile) return;
    const fileNameWithoutExtension = audioFile.name.split('.').slice(0, -1).join('.');

    downloadBtn.disabled = true;
    downloadBtn.textContent = 'Processing...';
    if (ffmpeg === null) {
        ffmpeg = new FFmpeg();
        ffmpeg.on("log", ({ message }) => {
            console.log(message);
        })
        ffmpeg.on("progress", ({ progress, time }) => {
            message.innerHTML = `${progress * 100} %, time: ${time / 1000000} s`;
        });
        await ffmpeg.load();
    }
    try {
        // Write the file to FFmpeg's virtual filesystem
        ffmpeg.writeFile('input', await fetchFile(audioFile));
        console.time('exec');
        // Run FFmpeg command to convert audio
        await ffmpeg.exec(['-i', 'input', '-ar', '22050', '-ac', '1', 'output.wav']);
        console.timeEnd('exec');

        // Read the result
        const data = await ffmpeg.readFile('output.wav');

        // Create download link
        const blob = new Blob([data.buffer], { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${fileNameWithoutExtension}_converted.wav`;
        a.click();

        // Cleanup
        URL.revokeObjectURL(url);
        // ffmpeg.FS('unlink', 'input');
        // ffmpeg.FS('unlink', 'output.wav');
    } catch (error) {
        console.error(error);
        info.innerHTML += '<p style="color: red;">Error during conversion!</p>';
    }

    downloadBtn.disabled = false;
    downloadBtn.textContent = 'Convert & Download';
});


