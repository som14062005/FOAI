import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // Looks for "Authorization: Bearer <token>"
      ignoreExpiration: false,
      secretOrKey: 'your_secret_key_here', // ✅ In production, use process.env.JWT_SECRET
    });
  }

  async validate(payload: any) {
    return {
      id: payload.sub,
      name: payload.name,
      role: payload.role,
      email: payload.email,
    };
  }
}
