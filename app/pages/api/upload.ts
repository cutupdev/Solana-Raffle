// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import axios from 'axios'
import type { NextApiRequest, NextApiResponse } from 'next'

const image_api_key = process.env.REACT_APP_IMAGE_BB;

type Expires = '86400' | '172800' | '259200'

const uploadImage = async (image: string, expires: Expires): Promise<string> => {
  const params = new URLSearchParams();
  params.append('image', image);
  const response = await axios.post(`https://api.imgbb.com/1/upload?expiration=${expires}&key=${image_api_key}`, params);
  return response.data.data.url;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const image: string = JSON.parse(req.body).image;
  console.log(image);
  if(image.length < 20) return res.status(400).json('Invalid Image');
  const url = await uploadImage(image, '259200');
  res.status(200).json(url);
}
