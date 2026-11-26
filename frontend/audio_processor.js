class AudioProcessor extends AudioWorkletProcessor {
    process(inputs) {
        const input = inputs[0]
        if (input.length > 0) {
            const audioSamples = input[0];
            console.log("This log won't appear in the browser console");
            this.port.postMessage(audioSamples.slice())
        }
        return true;
    }
}
registerProcessor("audio-processor", AudioProcessor)