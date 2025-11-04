import { ConfigService } from "@nestjs/config";
import { IoAdapter } from "@nestjs/platform-socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";
import { ServerOptions } from "socket.io";

export class RedisIoAdapter extends IoAdapter {
    private adapterConstructor: ReturnType<typeof createAdapter>

    constructor(private readonly configService: ConfigService) {
        super();
    }

    async connectToRedis(): Promise<void> {
        const host = this.configService.get<string>('REDIS_HOST');
        const port = this.configService.get<number>('REDIS_PORT');
        const pubClient = createClient({
            url: `redis://${host}:${port}`
        });
        const subClient = pubClient.duplicate();

        await Promise.all([pubClient.connect(), subClient.connect()]);
        this.adapterConstructor = createAdapter(pubClient, subClient);
    }

    createIOServer(port: number, options?: ServerOptions) {
        const server = super.createIOServer(port, {
            ...options,
            cors: {
                origin: '*'
            }
        });
        server.adapter(this.adapterConstructor);
        return server;
    }
}