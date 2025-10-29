import { ConfigService } from "@nestjs/config";
import { JwtModuleOptions, JwtSignOptions } from "@nestjs/jwt";

export const getJwtConfig = async (configService: ConfigService): Promise<JwtModuleOptions> => ({
    secret: configService.get<string>('JWT_SECRET'),
    signOptions: {
        expiresIn: configService.get<string>('JWT_EXPIRES_IN') as JwtSignOptions['expiresIn'],
    },
})