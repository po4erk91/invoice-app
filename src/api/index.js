const axios = require('axios');
const host = 'https://invoicesserver.herokuapp.com'

const request = async (url, method, data, formData, type) => {
  const contentType = formData ? 'multipart/form-data' : 'application/json'
  const responseType = type ? type : 'json'
  return await axios({
    method,
    url: `${host}${url}`,
    data,
    responseType,
    config: { 
      headers: {
        'Content-Type': contentType
      }
    }
  })
}

const createDocxApi = async (data) => {
  return await request("/create", "post", data)
}

const saveTemplateApi = async (data) => {
  return await request("/upload", "post", data, true)
}

const sendEmailsApi = async (data) => {
  return await request("/sendMail", "post", data)
}

const downloadArchive = async () => {
  return await request("/download", "get", false, false, 'blob')
}

export {
  createDocxApi,
  saveTemplateApi,
  downloadArchive,
  sendEmailsApi,
}