// Global constants
const canvas = document.getElementById('glCanvas'); // Get the canvas element 
const gl = canvas.getContext('webgl2'); // Get the WebGL2 context

if (!gl) {
    console.error('WebGL 2 is not supported by your browser.');
}

// Set initial canvas size
canvas.width = 500;
canvas.height = 500;

// Initialize WebGL settings: viewport and clear color
gl.viewport(0, 0, canvas.width, canvas.height);
gl.clearColor(0.1, 0.2, 0.3, 1.0);

// Render loop
function render() {
    const hw = canvas.width / 2;
    const hh = canvas.height / 2;

    gl.clear(gl.COLOR_BUFFER_BIT);

    const colors = [
        [[0, 0, 1, 1], [1, 0, 0, 1]],
        [[1, 1, 0, 1], [0, 1, 0, 1]]
    ];

    for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 2; j++) {
            const x = i * hw;
            const y = j * hh;

            gl.viewport(x, y, hw, hh);
            gl.scissor(x, y, hw, hh);

            gl.enable(gl.SCISSOR_TEST);

            gl.clearColor(...colors[i][j]);
            gl.clear(gl.COLOR_BUFFER_BIT);

            gl.disable(gl.SCISSOR_TEST);
        }
    }
}

// Start rendering

render();

// Resize viewport when window size changes

window.addEventListener('resize', () => {
    if (window.innerHeight >= window.innerWidth){
        canvas.width = window.innerWidth;
        canvas.height = window.innerWidth;
    }
    else{
        canvas.width = window.innerHeight;
        canvas.height = window.innerHeight;
    }

    gl.viewport(0, 0, canvas.width, canvas.height);
    render();
});
