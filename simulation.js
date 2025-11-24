class Node {
    constructor(x, y, id) {
        this.x = x;
        this.y = y;
        this.id = id;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.baseX = x;
        this.baseY = y;
        this.activation = 0;
        this.connections = [];
    }

    update() {
        // Gentle floating movement
        this.x += this.vx;
        this.y += this.vy;

        // Tether to base position
        const dx = this.baseX - this.x;
        const dy = this.baseY - this.y;
        this.vx += dx * 0.001;
        this.vy += dy * 0.001;

        // Damping
        this.vx *= 0.95;
        this.vy *= 0.95;

        // Decay activation
        this.activation *= 0.95;
        if (this.activation < 0.01) this.activation = 0;
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, 3 + this.activation * 5, 0, Math.PI * 2);

        // Color based on activation
        if (this.activation > 0.1) {
            ctx.fillStyle = `rgba(0, 243, 255, ${this.activation})`;
            ctx.shadowBlur = 15 * this.activation;
            ctx.shadowColor = "rgba(0, 243, 255, 0.8)";
        } else {
            ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
            ctx.shadowBlur = 0;
        }

        ctx.fill();
        ctx.shadowBlur = 0; // Reset shadow
    }
}

class Network {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.nodes = [];
        this.edges = [];
        this.nodeCount = 80;
        this.k = 4; // Neighbors in ring lattice
        this.p = 0.1; // Rewiring probability

        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.initSmallWorld();
        this.animate();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
        // Re-center nodes if they exist
        if (this.nodes.length > 0) {
            this.initSmallWorld();
        }
    }

    initSmallWorld() {
        this.nodes = [];
        this.edges = [];
        const radius = Math.min(this.canvas.width, this.canvas.height) * 0.35;

        // 1. Create Nodes in a Ring
        for (let i = 0; i < this.nodeCount; i++) {
            const angle = (i / this.nodeCount) * Math.PI * 2;
            const x = this.centerX + Math.cos(angle) * radius;
            const y = this.centerY + Math.sin(angle) * radius;
            this.nodes.push(new Node(x, y, i));
        }

        // 2. Create Ring Lattice Edges
        for (let i = 0; i < this.nodeCount; i++) {
            for (let j = 1; j <= this.k / 2; j++) {
                const targetIndex = (i + j) % this.nodeCount;
                this.edges.push({ source: i, target: targetIndex, type: 'lattice' });
            }
        }

        // 3. Rewire Edges (Watts-Strogatz)
        // Iterate through edges and rewire with probability p
        // Note: Simplified implementation for visual effect
        for (let i = 0; i < this.edges.length; i++) {
            if (Math.random() < this.p) {
                const edge = this.edges[i];
                // Keep source, change target to a random node
                let newTarget = Math.floor(Math.random() * this.nodeCount);
                // Avoid self-loops and duplicate edges (simple check)
                while (newTarget === edge.source || newTarget === edge.target) {
                    newTarget = Math.floor(Math.random() * this.nodeCount);
                }
                edge.target = newTarget;
                edge.type = 'rewired';
            }
        }

        this.updateStats();
    }

    injectSignal(type) {
        let count = 0;
        let intensity = 1.0;

        if (type === 'sensory') {
            // Activate a cluster of nodes
            const start = Math.floor(Math.random() * this.nodeCount);
            for (let i = 0; i < 5; i++) {
                const idx = (start + i) % this.nodeCount;
                this.nodes[idx].activation = 1.0;
                this.nodes[idx].vx += (Math.random() - 0.5) * 2;
                this.nodes[idx].vy += (Math.random() - 0.5) * 2;
            }
        } else if (type === 'logic') {
            // Activate distributed nodes
            for (let i = 0; i < 10; i++) {
                const idx = Math.floor(Math.random() * this.nodeCount);
                this.nodes[idx].activation = 0.8;
            }
        } else if (type === 'recall') {
            // Deep activation
            this.nodes.forEach(n => {
                if (Math.random() < 0.3) n.activation = 0.5;
            });
        }

        this.propagate();
    }

    propagate() {
        // Simple propagation logic
        // If a node is active, it activates its neighbors in the next frame
        // Handled in update loop via edge checks
    }

    rewire() {
        // Increase randomness/entropy
        this.p = Math.min(this.p + 0.1, 1.0);
        this.initSmallWorld();

        // Visual feedback
        const btn = document.getElementById('btn-rewire');
        if (btn) {
            const originalText = btn.innerText;
            btn.innerText = `Rewiring... (p=${this.p.toFixed(1)})`;
            setTimeout(() => btn.innerText = originalText, 1000);
        }
    }

    reset() {
        this.p = 0.1;
        this.initSmallWorld();
    }

    updateStats() {
        const activeCount = this.nodes.filter(n => n.activation > 0.1).length;
        const coherence = (1 - this.p) * 100; // Inverse of randomness

        document.getElementById('stat-active').innerText = activeCount;
        document.getElementById('stat-coherence').innerText = `${coherence.toFixed(0)}%`;
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw Edges
        this.ctx.lineWidth = 0.5;
        this.edges.forEach(edge => {
            const source = this.nodes[edge.source];
            const target = this.nodes[edge.target];

            // Calculate distance for opacity
            const dist = Math.hypot(source.x - target.x, source.y - target.y);
            let opacity = Math.max(0, 1 - dist / (this.canvas.width * 0.4));

            // Highlight active paths
            if (source.activation > 0.1 || target.activation > 0.1) {
                this.ctx.strokeStyle = `rgba(0, 243, 255, ${Math.max(source.activation, target.activation)})`;
                this.ctx.lineWidth = 1;

                // Propagate activation
                if (source.activation > 0.5 && target.activation < source.activation) {
                    target.activation += 0.05;
                }
                if (target.activation > 0.5 && source.activation < target.activation) {
                    source.activation += 0.05;
                }

            } else {
                this.ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.1})`;
                this.ctx.lineWidth = 0.5;
            }

            this.ctx.beginPath();
            this.ctx.moveTo(source.x, source.y);
            this.ctx.lineTo(target.x, target.y);
            this.ctx.stroke();
        });

        // Update and Draw Nodes
        this.nodes.forEach(node => {
            node.update();
            node.draw(this.ctx);
        });

        this.updateStats();
        requestAnimationFrame(() => this.animate());
    }
}

// Initialize
window.addEventListener('DOMContentLoaded', () => {
    const network = new Network('networkCanvas');

    // Bind Controls
    document.getElementById('btn-sensory').addEventListener('click', () => network.injectSignal('sensory'));
    document.getElementById('btn-logic').addEventListener('click', () => network.injectSignal('logic'));
    document.getElementById('btn-recall').addEventListener('click', () => network.injectSignal('recall'));
    document.getElementById('btn-rewire').addEventListener('click', () => network.rewire());
    document.getElementById('btn-reset').addEventListener('click', () => network.reset());

    console.log("Eren AGI Simulation Initialized");
});
