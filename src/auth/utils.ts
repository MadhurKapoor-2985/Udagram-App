import { decode } from 'jsonwebtoken'
import { JwtToken } from './JwtToken'

export function getUserId(jwtToken: string): string {
    const decodedToken = decode(jwtToken) as JwtToken

    return decodedToken.sub
}