export class Octahedron {
    constructor(gl, options = {}) {
        this.gl = gl;
        this.vertexCount = 24; // 8 triangular faces × 3 vertices each

        // Create buffers
        this.vao = gl.createVertexArray();
        this.vbo = gl.createBuffer();
        this.ebo = gl.createBuffer();

        // For edge length = 1, the central square has side length = 1
        // The vertical (y-axis) vertices are at ±(√2/2)
        const halfSquare = 0.5; // Half of the central square edge (1/2)
        const vertical = Math.sqrt(2) / 2; // Height calculated for equilateral triangles

        // 6 vertices configuration:
        this.vertices = new Float32Array([
            // Top and bottom vertices
            0, vertical, 0,  // top (0)
            0, -vertical, 0,  // bottom (1)

            // Central square on xz-plane (edge length = 1)
            halfSquare, 0, halfSquare,  // front-right (2)
            halfSquare, 0, -halfSquare,  // back-right (3)
            -halfSquare, 0, -halfSquare, // back-left (4)
            -halfSquare, 0, halfSquare  // front-left (5)
        ]);

        // 8 triangular faces (indices)
        this.indices = new Uint16Array([
            // Top faces
            0, 2, 3,  // top front-right to back-right
            0, 3, 4,  // top back-right to back-left
            0, 4, 5,  // top back-left to front-left
            0, 5, 2,  // top front-left to front-right

            // Bottom faces
            1, 3, 2,  // bottom back-right to front-right
            1, 4, 3,  // bottom back-left to back-right
            1, 5, 4,  // bottom front-left to back-left
            1, 2, 5   // bottom front-right to front-left
        ]);

        // Calculate normals (per vertex)
        this.normals = new Float32Array(6 * 3);
        this.calculateNormals();

        // Colors (default to sky blue if not provided)
        const defaultColor = options.color || [0.5, 0.8, 1.0, 1.0];
        this.colors = new Float32Array(6 * 4);
        for (let i = 0; i < 6; i++) {
            this.colors.set(defaultColor, i * 4);
        }

        // Texture coordinates (basic spherical mapping)
        this.texCoords = new Float32Array([
            // Top and bottom
            0.5, 1.0, // top
            0.5, 0.0, // bottom

            // Central square vertices
            0.75, 0.5, // front-right
            1.0, 0.5,  // back-right
            0.25, 0.5, // back-left
            0.0, 0.5   // front-left
        ]);

        this.initBuffers();
    }

    calculateNormals() {
        // Initialize normals to zero
        for (let i = 0; i < 18; i++) this.normals[i] = 0;

        // For each face, calculate face normal and add to each vertex
        for (let i = 0; i < 24; i += 3) {
            const a = this.indices[i] * 3;
            const b = this.indices[i + 1] * 3;
            const c = this.indices[i + 2] * 3;

            const v1 = [
                this.vertices[b] - this.vertices[a],
                this.vertices[b + 1] - this.vertices[a + 1],
                this.vertices[b + 2] - this.vertices[a + 2]
            ];

            const v2 = [
                this.vertices[c] - this.vertices[a],
                this.vertices[c + 1] - this.vertices[a + 1],
                this.vertices[c + 2] - this.vertices[a + 2]
            ];

            // Cross product
            const nx = v1[1] * v2[2] - v1[2] * v2[1];
            const ny = v1[2] * v2[0] - v1[0] * v2[2];
            const nz = v1[0] * v2[1] - v1[1] * v2[0];

            // Normalize (not strictly needed here as we normalize later)
            const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
            const normal = [nx / len, ny / len, nz / len];

            // Add to each vertex of the face
            for (let j = 0; j < 3; j++) {
                const idx = this.indices[i + j] * 3;
                this.normals[idx] += normal[0];
                this.normals[idx + 1] += normal[1];
                this.normals[idx + 2] += normal[2];
            }
        }

        // Normalize all vertex normals
        for (let i = 0; i < 18; i += 3) {
            const len = Math.sqrt(
                this.normals[i] * this.normals[i] +
                this.normals[i + 1] * this.normals[i + 1] +
                this.normals[i + 2] * this.normals[i + 2]
            );
            this.normals[i] /= len;
            this.normals[i + 1] /= len;
            this.normals[i + 2] /= len;
        }
    }

    initBuffers() {
        const gl = this.gl;

        // Calculate sizes
        const vSize = this.vertices.byteLength;
        const nSize = this.normals.byteLength;
        const cSize = this.colors.byteLength;
        const tSize = this.texCoords.byteLength;

        // Set up VAO
        gl.bindVertexArray(this.vao);

        // Vertex buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bufferData(gl.ARRAY_BUFFER, vSize + nSize + cSize + tSize, gl.STATIC_DRAW);

        // Upload data
        let offset = 0;
        gl.bufferSubData(gl.ARRAY_BUFFER, offset, this.vertices);
        offset += vSize;
        gl.bufferSubData(gl.ARRAY_BUFFER, offset, this.normals);
        offset += nSize;
        gl.bufferSubData(gl.ARRAY_BUFFER, offset, this.colors);
        offset += cSize;
        gl.bufferSubData(gl.ARRAY_BUFFER, offset, this.texCoords);

        // Element buffer
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ebo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

        // Vertex attributes
        offset = 0;
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, offset);
        offset += vSize;
        gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, offset);
        offset += nSize;
        gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 0, offset);
        offset += cSize;
        gl.vertexAttribPointer(3, 2, gl.FLOAT, false, 0, offset);

        // Enable attributes
        gl.enableVertexAttribArray(0);
        gl.enableVertexAttribArray(1);
        gl.enableVertexAttribArray(2);
        gl.enableVertexAttribArray(3);

        // Clean up
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindVertexArray(null);
    }

    draw(shader) {
        const gl = this.gl;
        shader.use();
        gl.bindVertexArray(this.vao);
        gl.drawElements(gl.TRIANGLES, this.vertexCount, gl.UNSIGNED_SHORT, 0);
        gl.bindVertexArray(null);
    }

    delete() {
        const gl = this.gl;
        gl.deleteBuffer(this.vbo);
        gl.deleteBuffer(this.ebo);
        gl.deleteVertexArray(this.vao);
    }
}
