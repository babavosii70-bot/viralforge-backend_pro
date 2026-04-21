# ForgeEngine Production Media Stack

ForgeEngine is a mission-critical, high-throughput AI media engine designed for automated video generation and optimization.

## 🏗️ Production Architecture
- **Backend (API)**: Express infrastructure with JWT authentication and Real-time Socket.io bridge.
- **Worker (Core)**: Standalone FFmpeg nodes executing high-fidelity vertical scaling and 60fps interpolation.
- **Job Engine**: BullMQ powered by Redis for resilient, multi-attempt job lifecycle management.
- **AI Optimization Loop**: An autonomous monitoring system that dynamically adjusts FFmpeg complexity based on real-world delivery success rates.

## 🚀 Deployment (Docker Compose)
The production stack is containerized for instant scaling:

```bash
docker-compose up --build
```

**Services Orchestrated:**
- **Redis (latest)**: High-speed job persistence and state sync.
- **Forge-Backend**: The central API and websocket coordinator.
- **Forge-Worker**: The heavy-lifting processing unit (scales to 1080x1920 with watermarking).

## 🛠️ Manual Operation
1. **Redis**: Ensure a Redis instance is reachable at `localhost:6379`.
2. **Setup**: `npm install`
3. **Execution**: `npm run dev` (Triggers Concurrent Operator Mode: Backend + Worker).

## 🎬 FFmpeg Production Pipeline
Every asset processed through ForgeEngine undergoes:
- **Reframing**: Linear vertical scale to 1080:1920 (TikTok optimization).
- **Interpolation**: Frame-rate stabilization to 60fps.
- **Identity**: Burned-in lowercase cinematic watermarking.
- **Codec**: Efficient H.264/AAC encoding with dynamic AI-selected presets.

## 🔐 Security Protocols
- **JWT**: Stateless token-based auth with `forgeengine_ultra_secure_2026_secret_key_!@#`.
- **RBAC**: Role-based access control (ADMIN/USER) enforced at both API and Database layers.
- **Storage**: Sanitized local and cloud storage paths for generated exports.
