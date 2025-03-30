// this function would populate fbc tables with the result of the hematological analyzer;

interface WBCFields {
    referenceRange: string,
    unit: string,
    value: string,
    field: string,
}


interface FullWBCData {
    machineName: string,
    date: number,
    user: string,
    ascensionid: string,
    fullname: string,
    patientid: string,
    gender: string
    fields: WBCFields[]
}


function checkReceivedData(data: FullWBCData) {

}