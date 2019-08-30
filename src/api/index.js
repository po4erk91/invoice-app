const axios = require('axios');
// const host = 'https://invoicesserver.herokuapp.com'
const host = 'http://127.0.0.1:5000'

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

const createDocxApi = async (docxs, folderID) => {
  const items = {
    docxs,
    folderID
  }
  return await request("/create", "post", items)
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

const resetAll = async () => {
  return await request("/reset", "get", false, false, 'text')
}

const emailMessage = async () => {
  return await request("/emailMessage", "get", false, false, 'text')
}

const getGoogleFolderId = async () => {
  return await request("/getGoogleFolderId", "get", false, false, 'text')
}

export {
  emailMessage,
  resetAll,
  createDocxApi,
  saveTemplateApi,
  downloadArchive,
  sendEmailsApi,
  getGoogleFolderId
}