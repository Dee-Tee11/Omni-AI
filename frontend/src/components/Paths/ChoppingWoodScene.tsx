

import React, { useEffect, useRef } from 'react';

const ChoppingWoodScene: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Escala para adaptar o desenho original (900x380) para o novo tamanho (1200x550)
        ctx.scale(1200 / 900, 550 / 380);

        // Animation variables
        let cloudOffset = 0;
        let birdX = 0;
        let birdFlap = 0;
        let waterShimmer = 0;
        let grassSway = 0;
        let fireFlicker = 0;
        let axeSwing = 0;
        let choppingPhase = 0;
        let woodPieces: Array<{ x: number; y: number; rotation: number; vx: number; vy: number; grounded: boolean }> = [];
        let chopCounter = 0;

        // ----- Drawing functions -----
        const drawSky = () => {
            const gradient = ctx.createLinearGradient(0, 0, 0, 380); // Usar altura original para gradiente
            gradient.addColorStop(0, '#87CEEB');
            gradient.addColorStop(1, '#B0E0E6');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 900, 380); // Usar dimensões originais
        };

        const drawSun = () => {
            ctx.fillStyle = '#FDB813';
            ctx.beginPath();
            ctx.arc(750, 70, 35, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'rgba(253, 184, 19, 0.3)';
            ctx.beginPath();
            ctx.arc(750, 70, 50, 0, Math.PI * 2);
            ctx.fill();
        };

        const drawCloud = (x: number, y: number, width: number, height: number) => {
            ctx.beginPath();
            ctx.ellipse(x, y, width / 2, height / 2, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(x + width / 3, y - 5, width / 3, height / 2, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(x - width / 3, y, width / 3, height / 2.5, 0, 0, Math.PI * 2);
            ctx.fill();
        };

        const drawClouds = () => {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            const cloud1X = (cloudOffset % 1000) - 100;
            drawCloud(cloud1X, 60, 100, 35);
            const cloud2X = ((cloudOffset + 500) % 1000) - 100;
            drawCloud(cloud2X, 100, 120, 40);
        };

        const drawBird = () => {
            ctx.strokeStyle = '#1a1a1a';
            ctx.lineWidth = 2;
            const y = 110 + Math.sin(birdFlap) * 3;
            ctx.beginPath();
            ctx.moveTo(birdX, y);
            ctx.quadraticCurveTo(birdX + 8, y - 8 + Math.sin(birdFlap) * 4, birdX + 16, y);
            ctx.stroke();
        };

        const drawMountains = () => {
            ctx.fillStyle = '#A8A8A8';
            ctx.beginPath();
            ctx.moveTo(0, 280);
            ctx.lineTo(100, 200);
            ctx.lineTo(200, 230);
            ctx.lineTo(350, 180);
            ctx.lineTo(500, 210);
            ctx.lineTo(650, 190);
            ctx.lineTo(800, 220);
            ctx.lineTo(900, 210);
            ctx.lineTo(900, 280);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#BEBEBE';
            ctx.globalAlpha = 0.7;
            ctx.beginPath();
            ctx.moveTo(0, 280);
            ctx.lineTo(150, 220);
            ctx.lineTo(300, 245);
            ctx.lineTo(450, 205);
            ctx.lineTo(600, 235);
            ctx.lineTo(750, 225);
            ctx.lineTo(900, 240);
            ctx.lineTo(900, 280);
            ctx.closePath();
            ctx.fill();
            ctx.globalAlpha = 1;
        };

        const drawGround = () => {
            const gradient = ctx.createLinearGradient(0, 280, 0, 380);
            gradient.addColorStop(0, '#7CB342');
            gradient.addColorStop(1, '#689F38');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 280, 900, 100);
        };

        const drawGrass = () => {
            ctx.strokeStyle = '#558B2F';
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            for (let i = 0; i < 20; i++) {
                const x = i * 45 + 20;
                const sway = Math.sin(grassSway + i * 0.5) * 2;
                ctx.beginPath();
                ctx.moveTo(x, 280);
                ctx.lineTo(x + sway, 268);
                ctx.stroke();
            }
        };

        const drawRiver = () => {
            const gradient = ctx.createLinearGradient(0, 330, 0, 380);
            gradient.addColorStop(0, '#4A90E2');
            gradient.addColorStop(1, '#357ABD');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 330, 900, 50);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            const shimmer1X = (waterShimmer * 2) % 900;
            ctx.beginPath();
            ctx.ellipse(shimmer1X, 345, 25, 4, 0, 0, Math.PI * 2);
            ctx.fill();
            const shimmer2X = (waterShimmer * 3 + 300) % 900;
            ctx.beginPath();
            ctx.ellipse(shimmer2X, 360, 20, 3, 0, 0, Math.PI * 2);
            ctx.fill();
        };

        const drawTree = (x: number, y: number, trunkHeight: number, foliageSize: number, foliageColor: string) => {
            ctx.fillStyle = '#8D6E63';
            ctx.fillRect(x - 6, y - trunkHeight, 12, trunkHeight);
            ctx.fillStyle = foliageColor;
            ctx.beginPath();
            ctx.arc(x, y - trunkHeight - 10, foliageSize, 0, Math.PI * 2);
            ctx.fill();
        };

        const drawTent = (x: number, y: number) => {
            ctx.fillStyle = '#FF6F00';
            ctx.strokeStyle = '#E65100';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x - 25, y);
            ctx.lineTo(x, y - 45);
            ctx.lineTo(x + 25, y);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#F57C00';
            ctx.beginPath();
            ctx.moveTo(x - 12, y);
            ctx.lineTo(x, y - 25);
            ctx.lineTo(x + 12, y);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#E65100';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x, y - 45);
            ctx.lineTo(x, y);
            ctx.stroke();
        };

        const drawFire = (x: number, y: number) => {
            ctx.fillStyle = '#5D4037';
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(Math.PI / 12);
            ctx.fillRect(-12, -2, 24, 4);
            ctx.restore();
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(-Math.PI / 12);
            ctx.fillRect(-12, -2, 24, 4);
            ctx.restore();
            const flicker = Math.sin(fireFlicker) * 0.1 + 1;
            ctx.fillStyle = '#FDD835';
            ctx.beginPath();
            ctx.ellipse(x, y - 15, 8 * flicker, 20 * flicker, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#FF6F00';
            ctx.beginPath();
            ctx.ellipse(x, y - 12, 6 * flicker, 15 * flicker, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#D32F2F';
            ctx.beginPath();
            ctx.ellipse(x, y - 8, 4 * flicker, 10 * flicker, 0, 0, Math.PI * 2);
            ctx.fill();
        };

        const drawWoodLog = (x: number, y: number) => {
            // Tronco em pé para cortar
            ctx.fillStyle = '#8D6E63';
            ctx.fillRect(x - 15, y - 50, 30, 50);

            // Textura de madeira
            ctx.strokeStyle = '#5D4037';
            ctx.lineWidth = 1;
            for (let i = 0; i < 5; i++) {
                ctx.beginPath();
                ctx.moveTo(x - 15, y - 45 + i * 10);
                ctx.lineTo(x + 15, y - 45 + i * 10);
                ctx.stroke();
            }

            // Topo do tronco
            ctx.fillStyle = '#A0826D';
            ctx.beginPath();
            ctx.ellipse(x, y - 50, 15, 8, 0, 0, Math.PI * 2);
            ctx.fill();

            // Anéis de crescimento
            ctx.strokeStyle = '#7A5C3E';
            ctx.lineWidth = 1;
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.ellipse(x, y - 50, 12 - i * 3, 6 - i * 1.5, 0, 0, Math.PI * 2);
                ctx.stroke();
            }

            // Marca de corte (aumenta com choppingPhase)
            if (choppingPhase > 0) {
                ctx.fillStyle = '#D7CCC8';
                const cutDepth = choppingPhase * 10;
                ctx.fillRect(x - 15, y - 25 - cutDepth / 2, 30, cutDepth);
            }
        };

        const drawWoodPiece = (x: number, y: number, rotation: number) => {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rotation);

            ctx.fillStyle = '#8D6E63';
            ctx.fillRect(-12, -20, 24, 40);

            ctx.strokeStyle = '#5D4037';
            ctx.lineWidth = 0.8;
            for (let i = 0; i < 4; i++) {
                ctx.beginPath();
                ctx.moveTo(-12, -15 + i * 10);
                ctx.lineTo(12, -15 + i * 10);
                ctx.stroke();
            }

            ctx.fillStyle = '#A0826D';
            ctx.beginPath();
            ctx.ellipse(0, -20, 12, 6, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(0, 20, 12, 6, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        };

        const drawWoodPile = () => {
            // Pilha de lenha cortada
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 2; j++) {
                    drawWoodPiece(680 + i * 25, 275 - j * 22, 0);
                }
            }
        };

        const drawChoppingCharacter = (x: number, y: number, swing: number) => {
            // Cabeça
            const headGradient = ctx.createRadialGradient(x - 3, y - 57, 3, x, y - 55, 13);
            headGradient.addColorStop(0, '#C89968');
            headGradient.addColorStop(0.7, '#B8895A');
            headGradient.addColorStop(1, '#9A7148');
            ctx.fillStyle = headGradient;
            ctx.beginPath();
            ctx.ellipse(x, y - 55, 11, 13, 0, 0, Math.PI * 2);
            ctx.fill();

            // Olhos
            ctx.fillStyle = '#F5E6D3';
            ctx.beginPath();
            ctx.ellipse(x - 4, y - 57, 2.5, 2, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(x + 4, y - 57, 2.5, 2, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#3E2723';
            ctx.beginPath();
            ctx.arc(x - 3.5, y - 57, 1.8, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x + 4.5, y - 57, 1.8, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(x - 3.5, y - 57, 1, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x + 4.5, y - 57, 1, 0, Math.PI * 2);
            ctx.fill();

            // Sobrancelhas
            ctx.strokeStyle = '#4A3628';
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(x - 7, y - 60);
            ctx.quadraticCurveTo(x - 4, y - 61, x - 1, y - 60);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x + 1, y - 60);
            ctx.quadraticCurveTo(x + 4, y - 61, x + 7, y - 60);
            ctx.stroke();

            // Nariz
            ctx.fillStyle = 'rgba(90, 60, 40, 0.2)';
            ctx.beginPath();
            ctx.ellipse(x, y - 53, 3, 4, 0, 0, Math.PI * 2);
            ctx.fill();

            // Boca
            ctx.strokeStyle = '#6D4C41';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(x - 3, y - 48);
            ctx.quadraticCurveTo(x, y - 47, x + 3, y - 48);
            ctx.stroke();

            // Barba
            ctx.fillStyle = '#3E2723';
            ctx.beginPath();
            ctx.moveTo(x - 9, y - 47);
            ctx.lineTo(x - 7, y - 44);
            ctx.lineTo(x + 7, y - 44);
            ctx.lineTo(x + 9, y - 47);
            ctx.quadraticCurveTo(x, y - 43, x - 9, y - 47);
            ctx.fill();

            // Capacete
            ctx.fillStyle = '#8D6E63';
            ctx.fillRect(x - 11, y - 68, 22, 7);

            // Corpo
            ctx.fillStyle = '#A0826D';
            ctx.fillRect(x - 14, y - 42, 28, 35);

            // Textura de pele
            ctx.strokeStyle = '#7A5C3E';
            ctx.lineWidth = 1;
            for (let i = 0; i < 6; i++) {
                ctx.beginPath();
                ctx.moveTo(x - 12, y - 40 + i * 6);
                ctx.lineTo(x + 12, y - 38 + i * 6);
                ctx.stroke();
            }

            // Braço esquerdo (parado)
            ctx.fillStyle = '#C89968';
            ctx.fillRect(x - 20, y - 35, 8, 25);

            // Braço direito com machado (movimento)
            const armAngle = swing * Math.PI / 2;
            ctx.save();
            ctx.translate(x + 14, y - 35);
            ctx.rotate(-armAngle);
            ctx.fillStyle = '#C89968';
            ctx.fillRect(0, -4, 22, 8);

            // Machado de pedra
            ctx.fillStyle = '#8D6E63';
            ctx.fillRect(20, -2, 30, 4);

            ctx.fillStyle = '#666666';
            ctx.beginPath();
            ctx.moveTo(48, -8);
            ctx.lineTo(56, 0);
            ctx.lineTo(48, 8);
            ctx.closePath();
            ctx.fill();

            ctx.restore();

            // Pernas
            ctx.fillStyle = '#A0826D';
            ctx.fillRect(x - 12, y - 7, 10, 22);
            ctx.fillRect(x + 2, y - 7, 10, 22);

            // Pés
            ctx.fillStyle = '#9A7148';
            ctx.beginPath();
            ctx.ellipse(x - 7, y + 16, 6, 3, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(x + 7, y + 16, 6, 3, 0, 0, Math.PI * 2);
            ctx.fill();
        };

        const render = () => {
            ctx.clearRect(0, 0, 900, 380); // Limpar área original
            drawSky();
            drawSun();
            drawClouds();
            drawBird();
            drawMountains();
            drawGround();
            drawGrass();
            drawRiver();
            drawTree(110, 280, 45, 30, '#4CAF50');
            drawTree(820, 280, 42, 28, '#66BB6A');
            drawTent(200, 280);
            drawFire(340, 280);

            // Tronco sendo cortado
            if (choppingPhase < 3) {
                drawWoodLog(500, 280);
            }

            // Pilha de lenha
            drawWoodPile();

            // Pedaços de madeira caindo/no chão
            woodPieces.forEach(piece => {
                drawWoodPiece(piece.x, piece.y, piece.rotation);
            });

            // Personagem cortando
            drawChoppingCharacter(400, 280, axeSwing);
        };

        const animate = () => {
            cloudOffset += 0.4;
            birdX += 0.8;
            if (birdX > 920) birdX = -20; // Ajuste para largura original
            birdFlap += 0.12;
            waterShimmer += 0.8;
            grassSway += 0.025;
            fireFlicker += 0.08;

            // Animação de cortar madeira
            axeSwing = Math.sin(chopCounter) * 0.5 + 0.5;

            // A cada swing completo, incrementa o progresso do corte
            if (Math.sin(chopCounter - 0.1) < 0 && Math.sin(chopCounter) >= 0) {
                if (choppingPhase < 3) {
                    choppingPhase += 0.5;
                }

                // Quando completar o corte, atira a madeira
                if (choppingPhase >= 2.5 && choppingPhase < 3) {
                    woodPieces.push({
                        x: 500,
                        y: 230,
                        rotation: Math.random() * Math.PI * 2,
                        vx: (Math.random() - 0.5) * 4 + 3,
                        vy: -8 - Math.random() * 3,
                        grounded: false
                    });
                    choppingPhase = 3;
                }
            }

            chopCounter += 0.08;

            // Física das madeiras caindo
            woodPieces.forEach(piece => {
                if (!piece.grounded) {
                    piece.x += piece.vx;
                    piece.y += piece.vy;
                    piece.vy += 0.3; // gravidade
                    piece.rotation += 0.1;

                    // Chão
                    if (piece.y >= 260) {
                        piece.y = 260;
                        piece.vx *= 0.7;
                        piece.vy *= -0.4;

                        if (Math.abs(piece.vy) < 0.5) {
                            piece.grounded = true;
                            piece.vy = 0;
                        }
                    }
                }
            });

            // Reseta após um tempo para repetir a animação
            if (chopCounter > Math.PI * 20) {
                chopCounter = 0;
                choppingPhase = 0;
                woodPieces = [];
            }

            render();
            requestAnimationFrame(animate);
        };

        animate();
    }, []);

    return (
        <canvas
            ref={canvasRef}
            width={1200}
            height={550}
            style={{
                maxWidth: '100%',
                borderRadius: '16px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.25)'
            }}
        />
    );
};

export default ChoppingWoodScene;