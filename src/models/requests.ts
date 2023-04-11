import { Knex } from 'knex'
var axios = require("axios").default;

export class RequestModel {

  saveSession(db: Knex.QueryInterface, cid, sessionId) {
    return db.table('dipchip_sessions')
      .insert({
        cid: cid,
        session_id: sessionId
      });
  }

  getProfile(token: String) {
    const options = {
      method: 'GET',
      url: 'https://members.moph.go.th/api/v1/m/user',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Bearer ${token}`
      }
    };
    return new Promise<any>((resolve, reject) => {
      axios.request(options).then(function (response) {
        resolve({ statusCode: response.status, body: response.data });
      }).catch(function (error) {
        resolve({ statusCode: error.response.status, error: error.response.data });
      });
    });
  }

  getUser(db, cid) {
    return db('users').where('cid', cid);
  }

  verifyKycDipchip(data) {
    const options = {
      method: 'POST',
      url: 'https://members.moph.go.th/api/v1/m/is_dipchip',
      headers: {
        'Content-Type': 'application/json'
      },
      data: {
        cid: data.cid,
        first_name: data.first_name,
        last_name: data.last_name,
        session_id: data.session_id,
        password_internet: data.password_internet
      }
    };
    return new Promise<void>((resolve, reject) => {
      axios(options).then(function (response) {
        resolve(response.data);
      }).catch(function (error) {
        reject(error)
      });
    });
  }

  getDeviceFcm(db, cid) {
    return db('devices')
      .where('cid', cid)
      .where('status', 'ONLINE')
      .groupBy('fcm_token')
  }

  updateKYCDip(db, sessionId, cid) {
    return db('users as u')
      .join('dipchip_sessions as d', 'u.cid', 'd.cid')
      .where('d.session_id', sessionId)
      .where('d.cid', cid)
      .update('u.is_ekyc', 'Y');
  }

  checkSession(db, sessionId, cid) {
    return db('dipchip_sessions')
      .where('session_id', sessionId)
      .where('cid', cid)
  }

  removeSession(db, sessionId, cid) {
    return db('dipchip_sessions')
      .where('session_id', sessionId)
      .where('cid', cid)
      .del();
  }

  generateUserInternet(data) {
    const options = {
      method: 'POST',
      url: 'https://internet-ops.moph.go.th/api/mymoph',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.INTERNET_OPS_TOKEN}`
      },
      data: {
        "username": `mymoph_${data.cid}`,
        "firstName": data.firstName,
        "lastName": data.lastName,
        "password": data.password,
        "cid": data.cid,
        "email": data.email,
        "type": "MYMOPH"
      }
    };
    return new Promise<void>((resolve, reject) => {
      axios(options).then(function (response) {
        resolve(response.data);
      }).catch(function (error) {
        reject(error)
      });
    });
  }
  changePasswordInternet(cid, data) {
    const options = {
      method: 'PUT',
      url: `https://internet-ops.moph.go.th/api/mymoph/cid/${cid}`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.INTERNET_OPS_TOKEN}`
      },
      data: {
        "password": data.password
      }
    };
    return new Promise<void>((resolve, reject) => {
      axios(options).then(function (response) {
        resolve(response.data);
      }).catch(function (error) {
        reject(error)
      });
    });
  }

  updateUser(db, data) {
    return db('users').insert(data).onConflict().merge()
    // update(data).where('cid', cid);
  }

}