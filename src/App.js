import React from 'react';
import './App.css';
import readXlsxFile from 'read-excel-file'
import { createDocxApi, saveTemplateApi, sendEmailsApi, downloadArchive, resetAll, emailMessage } from './api'

class App extends React.Component {

  state = {
    error: "",
    xlsxData: [],
    result: "Add your files .xlsx",
    template: "Add your template .docx",
    trigger: false,
    export: false,
    customerData: [],
    generate: "",
    customer: "",
    month: "",
    staff: "",
    exportMessage: "",
    reset: "",
    showPopup: false,
    email: "",
    message: ""
  }

  async componentDidMount(){
    const resp = await emailMessage()
    resp.status === 200 && this.setState({message: resp.data.message})
  }

  saveTemplate = async (e) => {
    const bodyFormData = new FormData()
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
      emails.push({
        email: item.StaffEmail,
        name: item.StaffNameEN,
      })
    })
    const resp = await sendEmailsApi({emails, message: this.state.message})
    if(resp.status === 200){
      this.setState({
        showPopup: false,
        exportMessage: "Emails was sended!"
      })
    } else {
      this.setState({
        showPopup: false,
        exportMessage: "Emails not sended!"
      })
    }
  }

  setData = (arr) => {
    const {xlsxData,customerData} = this.state
    let newArr;
    if(xlsxData.length){
      newArr = []
      xlsxData.forEach((item, i) => {
        const customer = customerData.find(c => c.CustomerId === item.MonthId)
        newArr.push({
          ...customer,
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
        generate: added && "Press Generate to create PDF"
      })
    })
  }

  saveXlsxData = (file, type) => {
    readXlsxFile(file).then((rows) => {
      const headers = rows[0];
      const data = [];
      const arr = [];

      for(let i = 1; i < rows.length; i++){
        const dataItem = {
          titles: [],
          bodies: []
        }
        dataItem.bodies = rows[i]
        dataItem.titles = headers;
        data.push(dataItem)
      }
      data.forEach((item) => {
        let obj = {}
        item.titles.forEach((title, i) => {
          obj[type + title.replace(':','')] = item.bodies[i]
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
    this.setState({generate: "Loading..."})
    const promises = data.map(async item => await createDocxApi(item))
    const resp = await Promise.all(promises)
    if(resp.every(r => r.status === 200)){
      this.setState({generate: "Completed!", export: true, reset: "Invoices was generated!"})
    } else {
      this.setState({generate: "Failed!"})
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

  resetAll = async () => {
    const response = await resetAll()
    if(response.status === 200) this.setState({
      reset: response.data,
      error: "",
      xlsxData: [],
      result: "Add your files .xlsx",
      template: "Add your template .docx",
      trigger: false,
      export: false,
      customerData: [],
      customer: "",
      generate: "",
      month: "",
      staff: "",
      exportMessage: ""
    })
  }

  renderResetBtn = () => {
    return <input
      className="reset"
      type="button"
      value="Reset"
      onClick={() => this.resetAll()}
    />
  }

  renderInputWrapper = () => {
    return <div className="input-wrapper">
      <div className="input-block">
        {this.renderFileInput("customer",e => this.saveCustomer(e, 'Customer'))}
        {this.renderLabel("customer","Choose a Customer")}
        {this.state.customer && this.renderMessage(this.state.customer)}
      </div>
      <div className="input-block">
        {this.renderFileInput("month",e => this.saveMonth(e, 'Month'))}
        {this.renderLabel("month","Choose a Month")}
        {this.state.month && this.renderMessage(this.state.month)}
      </div>
      <div className="input-block">
        {this.renderFileInput("staff",e => this.saveStaff(e, 'Staff'))}
        {this.renderLabel("staff","Choose a Staff")}
        {this.state.staff && this.renderMessage(this.state.staff)}
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
        {this.renderMessage(this.state.template)}
        {this.renderFileInput("template",e => {this.saveTemplate(e); e.target.value = null})}
        {this.renderLabel("template","Choose a Template")}
      </div>
    )
  }

  renderMessage = (message) => {
    return <div className="message">
      {message}
    </div>
  }

  renderError = (message) => {
    const {error} = this.state
    const color = error.length ? "red" : "lightgreen"
    return <div className="error" style={{color}}>
      {message}
    </div>
  }

  renderSendMail = () => {
    return <input
      className="send-mail"
      type="button"
      value="Send Emails"
      onClick={() => this.setState({showPopup: true})}
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

  renderEmailPopup = () => {
    return(
      <div className="email-wrapper" onClick={(e) => {
        e.target.className === "email-wrapper" && this.setState({showPopup: false})
      }}>
        <div className="email-container">
          {/* {this.renderMessage("Enter your sending email:")}
          <input
            type="email"
            name={"email"}
            id={"email"}
            className="inputemail"
            onChange={(e) => this.setState({email: e.target.value})}
          /> */}
          {this.renderMessage("Enter your message:")}
          <textarea
            rows="10"
            cols="45"
            name="text"
            className="email-text"
            value={this.state.message}
            onChange={(e) => this.setState({message: e.target.value})}
          />
          <input
            className="send-mail"
            type="button"
            value="Send Emails"
            onClick={() => this.sendEmails()}
          />
        </div>
      </div>
    )
  }

  render() {
    return (
      <div className="App">
        <div className="App-header">
          {this.renderError(this.state.error || this.state.reset)}
          {this.renderTemplateWrapper()}

          {this.renderMessage(this.state.result)}
          {this.renderInputWrapper()}
          
          {this.state.trigger && this.renderGenerateBtn()}
          {this.renderMessage(this.state.generate)}

          {this.state.export && this.renderExport()}
          {this.renderMessage(this.state.exportMessage)}
          {this.renderResetBtn()}
          {this.state.showPopup && this.renderEmailPopup()}
        </div>
      </div>
    );
  }
}

export default App;
