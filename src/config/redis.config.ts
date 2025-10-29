import { ConfigService } from "@nestjs/config";
import { RedisClientOptions } from "redis";

export const getRedisConfig = (configService: ConfigService): RedisClientOptions => ({
    socket: {
        host: configService.get<string>('REDIS_HOST'),
        port: configService.get<number>('REDIS_PORT')
    },
})