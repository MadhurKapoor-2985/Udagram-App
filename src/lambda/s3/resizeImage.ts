import { SNSEvent, SNSHandler, S3EventRecord } from 'aws-lambda'
import 'source-map-support/register'
import * as AWS from 'aws-sdk'
import Jimp from 'jimp/es'

const s3 = new AWS.S3()

const imagesBucketName = process.env.IMAGES_S3_BUCKET
const thumbnailsBucketName = process.env.THUMBNAILS_S3_BUCKET

export const handler: SNSHandler = async (event: SNSEvent) => {

    console.log('Processing event', JSON.stringify(event))
    for(const record of event.Records) {

        const s3EventStr = record.Sns.Message
        console.log('Processing S3 event', s3EventStr)
        const s3Event = JSON.parse(s3EventStr)

        for(const record of s3Event.Records) {
            await processImage(record)

        }

       
    }

}

async function processImage(record: S3EventRecord) {
    const key = record.s3.object.key
    console.log('Processing image with key ', key)
    const response = await s3.getObject({
        Bucket: imagesBucketName,
        Key:key
    }).promise()

    const body = response.Body

    await resizeImage(body, key)
}

async function resizeImage(body, key) {

    const image = await Jimp.read(body)

    image.resize(150, Jimp.AUTO)

    const convertedBuffer = await image.getBufferAsync(Jimp.AUTO)

    await s3.putObject({
        Bucket: thumbnailsBucketName,
        Key: `${key}.jpeg`,
        Body: convertedBuffer
    }).promise()

}
