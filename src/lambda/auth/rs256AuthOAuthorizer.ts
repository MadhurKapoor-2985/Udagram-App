import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'

import { verify } from 'jsonwebtoken'
import { JwtToken } from '../../auth/JwtToken'

const cert = `-----BEGIN CERTIFICATE-----
MIIDBzCCAe+gAwIBAgIJeQYBGqyex5SyMA0GCSqGSIb3DQEBCwUAMCExHzAdBgNV
BAMTFmRldi03NDFoeWNsby5hdXRoMC5jb20wHhcNMTkwODEwMDk0MDMxWhcNMzMw
NDE4MDk0MDMxWjAhMR8wHQYDVQQDExZkZXYtNzQxaHljbG8uYXV0aDAuY29tMIIB
IjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA5QgMGKbI9wngcjVB7s85EGCr
dqjsOKysaJhUobf/GBzYiCwpsjPy16x5JO7Vb+8s9N4QOjK1r2LO13BhP+cG5iFV
QnmGWowPq6vklI2qkd2+aDG6lsG93WClSYmzgoF9H9w8Fm9SZg6Wd7nowBhUqtnd
4B5zaj0ZDnRyoJBezL7PC8UZe/Qq41Dyt6WtiKfDcXZfwfHk6OTK5A8L6yRMZ6R5
n1eYAQvVgX1+mi1f55voTxSDPwVzg9TLhEQyKx8vlgoxPu2l4utRcornIvl72ZZz
VYIpwK6VyEyKQ4f6yLZEzC3YrR9btU3L3MYQRcCjiLObjfU/BSiiWN7grN8pQwID
AQABo0IwQDAPBgNVHRMBAf8EBTADAQH/MB0GA1UdDgQWBBSWBUhcApQVusgTh0LL
rBOrSNWU1jAOBgNVHQ8BAf8EBAMCAoQwDQYJKoZIhvcNAQELBQADggEBACwd2WJ8
R8+GzUIZNALD6us8uaRH1pop1Icb5A8810DTn61EBirS4FzMo+I0A3QTzX05AVmt
JYlzIrw4kdR/PRAPR1P2xUvUs2dF6qpxpO3tLX2UQ/ks0+dlTmpdb/AUtTdBguPp
lrLtBssnbzcakqzcIKSgsUPpLYN8fPxlrsobQ21L+17ZBKItrOvB1tBtnxey5CXk
oGtqtl2Si7iHc1xBAlYe7HzpFQOUKZoRjlZPAG+jHxZGZ+CpqBJYDCjAZ9Vmkp5f
NB4rJUm+lPP8UYJ/neH/w7PEk/q/7TEVXvIVTEPA5r4TfDhh8wCZUyLBS0w9cztB
SuSW3GSncB3ra80=
-----END CERTIFICATE-----
`

export const handler = async (event: CustomAuthorizerEvent): Promise<CustomAuthorizerResult> => {
    try {
        const jwtToken = verifyToken(event.authorizationToken)
        
        console.log('User was authorized')

        return {
            principalId: jwtToken.sub,
            policyDocument: {
              Version: '2012-10-17',
              Statement: [
                {
                  Action: 'execute-api:Invoke',
                  Effect: 'Allow',
                  Resource: '*'
                }
              ]
            }
          }

    } catch(e) {

        console.log('User was not authorized', e.message)
        return {
            principalId: 'user',
            policyDocument: {
              Version: '2012-10-17',
              Statement: [
                {
                  Action: 'execute-api:Invoke',
                  Effect: 'Deny',
                  Resource: '*'
                }
              ]
            }
          }

    }
}

function verifyToken(authHeader: String): JwtToken {
    if(!authHeader) {
        throw new Error('No authorization token')
    }

    if(!authHeader.toLocaleLowerCase().startsWith('bearer ')) {
        throw new Error('Invalid authorization header')
    }

    const split = authHeader.split(' ')
    const token = split[1]
    console.log('Token is ', token)
    return verify(token, cert, {algorithms: ['RS256'] }) as JwtToken
}
