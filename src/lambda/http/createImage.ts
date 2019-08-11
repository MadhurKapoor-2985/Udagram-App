import {  APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import 'source-map-support/register'
import * as AWS  from 'aws-sdk'
import * as uuid from 'uuid';

import * as middy from 'middy'
import { cors } from 'middy/middlewares'

const docClient = new AWS.DynamoDB.DocumentClient()

const s3 = new AWS.S3({
  signatureVersion: 'v4'
})

const groupsTable = process.env.GROUPS_TABLE
const imagesTable = process.env.IMAGES_TABLE
const bucketName = process.env.IMAGES_S3_BUCKET
const urlExpiration = Number.parseInt(process.env.SIGNED_URL_EXPIRATION)

export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Caller event', event)
  const groupId = event.pathParameters.groupId
  const validGroupId = await groupExists(groupId)

  if (!validGroupId) {
    return {
      statusCode: 404,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Group does not exist'
      })
    }
  }

  // TODO: Create an image
  const imageId = uuid.v4()

  const parsedBody = JSON.parse(event.body)

  const newItem = {
      imageId: imageId,
      groupId: groupId,
      timestamp: new Date().toISOString(),
      ...parsedBody,
      imageUrl: `https://${bucketName}.s3.amazonaws.com/${imageId}`
  }

  await createImage(newItem);

  const url = getUploadUrl(imageId)

  return {
    statusCode: 201,
    body: JSON.stringify({newItem: newItem,
    uploadUrl: url})
  }
})

async function groupExists(groupId: string) {
  const result = await docClient
    .get({
      TableName: groupsTable,
      Key: {
        id: groupId
      }
    })
    .promise()

  console.log('Get group: ', result)
  return !!result.Item
}

async function createImage(newItem) {
 return await docClient.put({
    TableName: imagesTable,
    Item: newItem
}).promise()
}

function getUploadUrl(imageId: String) {
  return s3.getSignedUrl('putObject', {
    Bucket: bucketName,
    Key: imageId,
    Expires: urlExpiration
  })
}

handler.use(
  cors({
    credentials: true
  })
)