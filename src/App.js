import React from 'react';
import './App.css';
import readXlsxFile from 'read-excel-file'
import { createDocxApi, saveTemplateApi, sendEmailsApi, downloadArchive } from './api'

class App extends React.Component {

  state = {
    error: "",
    xlsxData: [],
    result: "Add your files .xlsx",
    template: "Add your template .docx",
    trigger: false,
    export: false,
    customerData: [],
    customer: "",
    month: "",
    staff: "",
    exportMessage: ""
  }

  saveTemplate = async (e) => {
    var bodyFormData = new FormData()
    bodyFormData.append('template', e.target.files[0]);
    const resp = await saveTemplateApi(bodyFormData)
    if(resp.status === 200){
      this.setState({template: "Uploaded!"})
    }else{
      this.setState({template: "Upload Failed!"})
    }
  }

  sendEmails = async () => {
    const emails = []
    this.state.xlsxData.forEach(item => {
      emails.push({email: item.StaffEmail, name: item.StaffNameEN})
    })
    const resp = await sendEmailsApi(emails)
    if(resp.status === 200){
      this.setState({
        exportMessage: "Emails was sended!"
      })
    }
    console.log(resp)
  }

  setData = (arr) => {
    const {xlsxData,customerData} = this.state
    let newArr;
    if(xlsxData.length){
      newArr = []
      xlsxData.forEach((item, i) => {
        newArr.push({
          ...customerData[0],
          ...item,
          ...arr[i]
        })
      })
    }else{
      newArr = arr
    }
    this.setState({
      xlsxData: newArr
    })
  }

  changeStatus = (type) => {
    this.setState({
      [type.toLowerCase()]: "Added!"
    }, () => {
      const {customer,staff,month} = this.state
      const added = customer === "Added!" && staff === "Added!" && month === "Added!"
      this.setState({
        trigger: added,
        result: added ? "Press Generate to create PDF" : this.state.result
      })
    })
  }

  saveXlsxData = (file, type) => {
    readXlsxFile(file).then((rows) => {
      const names = rows[0];
      const customers = [];
      const arr = []
      for(let i = 1; i < rows.length; i++){
        const customer = {
          titles: [],
          customer: []
        }
        customer.customer = rows[i]
        customer.titles = names;
        customers.push(customer)
      }
      customers.forEach((item) => {
        let obj = {}
        item.titles.forEach((title, i) => {
          obj[type + title.replace(':','')] = item.customer[i]
        })
        arr.push(obj)
      })
      if(type === "Customer"){
        this.setState({
          customerData: arr
        })
        this.changeStatus(type)
        return
      }
      this.setData(arr)
      this.changeStatus(type)
    }).catch((e) => console.log(e))
  }

  saveCustomer = (e, type) => {
    this.setState({error: ""})
    this.saveXlsxData(e.target.files[0],type)
    e.target.value = null
  }

  saveMonth = (e, type) => {
    if(this.state.customer === 'Added!'){
      this.saveXlsxData(e.target.files[0],type)
      this.setState({error: ""})
    }else{
      this.setState({error: "Please add customer first"})
    }
    e.target.value = null
  }

  saveStaff = (e, type) => {
    const trigger = 'Added!'
    if(this.state.customer === trigger && this.state.month === trigger){
      this.saveXlsxData(e.target.files[0],type)
      this.setState({error: ""})
    }else{
      this.setState({error: "Please add customer and month first"})
    }
    e.target.value = null
  }

  saveDock = async (data) => {
    this.setState({result: "Loading..."})
    const promises = data.map(async item => await createDocxApi(item))
    const resp = await Promise.all(promises)
    if(resp.every(r => r.status === 200)){
      this.setState({result: "Completed!", export: true})
    } else {
      this.setState({result: "Failed!"})
    }
  }

  saveArchive = async () => {
    const response = await downloadArchive()
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'invoices.zip');
    document.body.appendChild(link);
    link.click();
    this.setState({
      exportMessage: "Invoices was saved!"
    })
  }

  renderGenerateBtn = () => {
    return <input
      className="generate"
      type="button"
      value="Generate"
      onClick={() => this.saveDock(this.state.xlsxData)}
    />
  }

  renderInputWrapper = () => {
    return <div className="input-wrapper">
      <div className="input-block">
        {this.renderMessage(this.state.customer)}
        {this.renderFileInput("customer",e => this.saveCustomer(e, 'Customer'))}
        {this.renderLabel("customer","Choose a Customer")}
      </div>
      <div className="input-block">
        {this.renderMessage(this.state.month)}
        {this.renderFileInput("month",e => this.saveMonth(e, 'Month'))}
        {this.renderLabel("month","Choose a Month")}
      </div>
      <div className="input-block">
        {this.renderMessage(this.state.staff)}
        {this.renderFileInput("staff",e => this.saveStaff(e, 'Staff'))}
        {this.renderLabel("staff","Choose a Staff")}
      </div>
    </div>
  }

  renderLabel = (type,text) => {
    return <label htmlFor={type} className="label">{text}</label>
  }

  renderFileInput = (type,func) => {
    return <input 
      type="file" 
      name={type}
      id={type} 
      className="inputfile"
      onChange={func}
    />
  }

  renderTemplateWrapper = () => {
    return(
      <div>
        {this.renderFileInput("template",e => this.saveTemplate(e))}
        {this.renderLabel("template","Choose a Template")}
        {this.renderMessage(this.state.template)}
      </div>
    )
  }

  renderMessage = (message) => {
    return <div className="message">
      {message}
    </div>
  }

  renderSendMail = () => {
    return <input
      className="send-mail"
      type="button"
      value="Send Emails"
      onClick={() => this.sendEmails()}
    />
  }

  renderDownload = () => {
    return <input
      className="send-mail"
      type="button"
      value="Download Invoices"
      onClick={() => this.saveArchive()}
    />
  }

  renderExport = () => {
    return <div className="export-wrapper">
      {this.renderSendMail()}
      {this.renderDownload()}
    </div>
  }

  render() {
    return (
      <div className="App">
        <div className="App-header">
          {this.renderMessage(this.state.error)}
          {this.renderTemplateWrapper()}
          {this.renderInputWrapper()}
          {this.state.trigger && this.renderGenerateBtn()}
          {this.renderMessage(this.state.result)}
          {this.state.export && this.renderExport()}
          {this.renderMessage(this.state.exportMessage)}
        </div>
      </div>
    );
  }
}

export default App;
