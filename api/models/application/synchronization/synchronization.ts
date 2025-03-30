import { _current_record_synchronization, syncRequestQuery } from "../queries";
import { promisifyQuery, rowAffected } from "../../../../helper";
import { SynchonizationData } from "./Types";

async function getSyncCurrentRecord() {
  return await promisifyQuery(_current_record_synchronization);
}

function parseTarget(test: string) {
  if (!test.includes(",")) throw new Error("wrong string  provided");
  const list = test.split(",").map((a, b) => parseInt(a));
  return list;
}

async function requestSynchronization(syncdata: number[] | string, requestby: number) {
  let requestdata: string = "";
  if (typeof syncdata == "string" && syncdata.includes(",")) {
    requestdata = syncdata;
  } else if (Array.isArray(syncdata) && syncdata.length > 0) {
    requestdata = syncdata.join(",");
  } else {
    throw new TypeError("Bad Data provide,array of numbers required or a , split string");
  }
  const request = rowAffected(await promisifyQuery(syncRequestQuery, [requestdata, requestby]));
}

export async function synchronize() {
  let testList = await getSyncCurrentRecord();
  let shouldSyn = await shouldSynchronize(testList);
  if (!shouldSyn) return false;
  const Tpackets = await promisifyQuery(`SELECT * FROM customtestcreation WHERE testid IN (${testList})`);
  if (Tpackets.length == 0) return false;
  const parsedTest = parseTarget(testList);
  const synTest = {};
  for (let i = 0; i < parsedTest.length; i++) {
    synTest[parsedTest[i]] = Tpackets.filter((a: any, b: number) => parsedTest[i] == a.testid);
  }
  return synTest;
}

async function shouldSynchronize(record: SynchonizationData[]): Promise<boolean> {
  if (record.length == 0) return false;
  const packet: SynchonizationData = record[0];
  const { status, lastSyncdatetime } = packet;
  if (status == "done" && lastSyncdatetime != null) return false;
  return true;
}

// requestSynchronization("1001100,1001101,1001102,1001103", 3)
//   .then((t) => console.log(t))
//   .catch((d) => console.log(d));
