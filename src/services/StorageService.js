const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { publishEvent } = require("./PublisherService");

const s3Client = new S3Client({
  endpoint: process.env.AWS_ENDPOINT_URL,
  forcePathStyle: true
});

const BUCKET_NAME = process.env.PRODUCT_IMAGE_BUCKET_NAME || "product-images";

async function uploadFile(name, buffer) {
  const result = await s3Client.send(new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: name,
    Body: buffer
 }));

 console.log(`Successfully uploaded file to S3 with key ${name}`, result);

 publishEvent("products", {
    action: "image_uploaded",
    product_id: name.split(".")[0],
    image_url: `http://localhost:4566/${BUCKET_NAME}/${name}`,
 });

 return result;
}

module.exports = {
  uploadFile,
};