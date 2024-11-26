const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { publishEvent } = require("./PublisherService");

const s3Client = new S3Client({
  endpoint: process.env.AWS_ENDPOINT_URL,
  forcePathStyle: true,
});

const BUCKET_NAME = process.env.PRODUCT_IMAGE_BUCKET_NAME || "product-images";

async function uploadFile(id, name, buffer) {
  const result = await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: `${id}/${name}`,
      Body: buffer,
    }),
  );

  console.log(`Successfully uploaded file to S3 with key ${name}`, result);

  const details = {
    action: "image_uploaded",
    product_id: id,
    filename: name,
  };

  await publishEvent("products", details);

  return details;
}

module.exports = {
  uploadFile,
};
