'use client';

import React, { useState } from 'react';
import GlitchGL from '@/components/GlitchGL';

export default function DemoGlitch() {
    const [pixelSize, setPixelSize] = useState(10);
    const [scanlines, setScanlines] = useState(0.3);

    return (
        <div className="min-h-screen bg-black text-white p-8">
            <h1 className="text-3xl font-bold mb-8">GlitchGL Next.js Demo</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-6">
                    <div className="border border-white/20 p-4 rounded-lg">
                        <h2 className="text-xl mb-4">Controls</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block mb-1 text-sm">Pixel Size: {pixelSize}</label>
                                <input
                                    type="range" min="1" max="50" value={pixelSize}
                                    onChange={(e) => setPixelSize(parseInt(e.target.value))}
                                    className="w-full"
                                />
                            </div>
                            <div>
                                <label className="block mb-1 text-sm">Scanline Intensity: {scanlines}</label>
                                <input
                                    type="range" min="0" max="1" step="0.1" value={scanlines}
                                    onChange={(e) => setScanlines(parseFloat(e.target.value))}
                                    className="w-full"
                                />
                            </div>
                        </div>
                    </div>

                    <p className="text-gray-400">
                        This component renders using a custom WebGL pipeline optimized for Next.js.
                        It features pixelation, CRT simulation, and mouse-based distortion.
                    </p>
                </div>

                <div className="aspect-video w-full rounded-xl overflow-hidden border-2 border-pink-500 shadow-[0_0_20px_rgba(236,72,153,0.3)]">
                    <GlitchGL
                        src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=1000"
                        effects={{
                            pixelation: { enabled: true, pixelSize },
                            crt: { enabled: true, scanlineIntensity: scanlines, scanlineCount: 400, brightness: 1.1 },
                        }}
                        interaction={{
                            enabled: true,
                            radius: 150,
                            intensity: 1.5
                        }}
                        className="w-full h-full"
                    />
                </div>
            </div>
        </div>
    );
}
