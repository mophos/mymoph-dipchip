import { RequestModel } from './../models/requests';
import * as express from 'express';
import { Router, Request, Response } from 'express';
import { Jwt } from '../models/jwt';
import { v4 as uuidv4 } from 'uuid';
import { nanoid } from 'nanoid'
import * as HttpStatus from 'http-status-codes';
import { FcmModel } from './../models/fcm';
var generator = require('generate-password');
const jwt = new Jwt();
const requestModel = new RequestModel();
const router: Router = Router();
const fcmModel = new FcmModel();

router.get('/', (req: Request, res: Response) => {
  res.send({ ok: true, message: 'Welcome to RESTful api server!', code: HttpStatus.OK });
});

router.get('/qr', async (req: Request, res: Response) => {
  try {
    const cid = req.query.cid;
    const sessionId: any = await nanoid();
    // const sessionId: any = await uuidv4();
    const rs: any = await requestModel.saveSession(req.db, cid, sessionId);
    if (rs) {
      res.send({ ok: true, sessionId: sessionId });
    } else {
      res.send({ ok: false })
    }
  } catch (error) {
    res.send({ ok: false, error: error.message, code: HttpStatus.INTERNAL_SERVER_ERROR });
  }

});


router.post('/dipchip', async (req: Request, res: Response) => {
  try {
    const sessionId = req.body.session_id;
    const accessToken = req.body.access_token;
    const refreshToken = req.body.refresh_token;
    const cid = sessionId.split("-")[0];
    const fname = sessionId.split("-")[1];
    const lname = sessionId.split("-")[2];
    const newSessionId = `${sessionId.split("-")[0]}-${sessionId.split("-")[3]}`;
    // save session for verify
    const rs: any = await requestModel.getProfile(accessToken);
    if (rs.cid) {
      if (rs.cid == cid) {
        const device: any = await requestModel.getDeviceFcm(req.db, cid);
        const info: any = await requestModel.getUser(req.db, rs.cid);
        const checkss: any = await requestModel.checkSession(req.db, newSessionId, cid);
        await requestModel.removeSession(req.db, newSessionId, cid);
        if (info.length && checkss.length) {
          const passwordInternet = await generator.generate({
            length: 20,
            numbers: true
          });
          await requestModel.updateUser(req.db, rs.cid, { password_internet: passwordInternet });
          const obj: any = {
            cid: cid,
            first_name: fname,
            last_name: lname,
            session_id: newSessionId
          }
          const vf: any = await requestModel.verifyKycDipchip(obj);
          if (vf.ok) {
            // mqtt
            for (const d of device) {
              fcmModel.sendMessage(d.fcm_token, 'ยืนยันตัวตนสำเร็จ', 'ยินดีด้วย คุณสามารถใช้ฟังชั่นต่างๆได้แล้ว', { GOTO: 'PINCODE' })
              // client.publish(topic, '{"topic":"KYC","status":true}');
            }
            await requestModel.updateKYCDip(req.db, newSessionId, cid);
            let isCreate: any = false;
            try {
              let _isCreate: any = await requestModel.generateUserInternet({
                "firstName": info[0].first_name,
                "lastName": info[0].last_name,
                "password": passwordInternet,
                "cid": info[0].cid,
                "email": info[0].email,
                "type": "MYMOPH"
              });

              if (!_isCreate.ok) {
                if (_isCreate.error_code == 'ER_DUP_ENTRY') {
                  _isCreate = await requestModel.changePasswordInternet(info[0].cid, {
                    "password": passwordInternet
                  })
                }
              }
              isCreate = _isCreate.ok;
            } catch (error) {
              console.log(error);
            }
            await requestModel.updateUser(req.db, info[0].cid,
              {
                password_internet: passwordInternet,
                is_ekyc: 'Y',
                is_created_ldap: isCreate ? 'Y' : 'N'
              });

            res.send({ ok: true });
          } else {
            for (const d of device) {
              fcmModel.sendMessage(d.fcm_token, 'ยืนยันตัวตนไม่สำเร็จ', 'กรุณาลองใหม่อีกครั้ง')
            }
            res.status(500);
            res.send({ ok: false, error: 'update member ไม่ได้' });
          }
        } else {
          for (const d of device) {
            fcmModel.sendMessage(d.fcm_token, 'ยืนยันตัวตนไม่สำเร็จ', 'กรุณาลองใหม่อีกครั้ง')
          }
          // not found
          res.send({ ok: false, error: 'session not found' });
        }
      } else {
        console.log('cid!=cid');
        res.send({ ok: false, error: 'cid!=cid' });
      }
    } else {
      console.log('errgetpf');
      res.send({ ok: false, error: 'getpf' });
    }
  } catch (error) {
    console.log(error);
    res.send({ ok: false });
  }
});

router.post('/dipchip/v2', async (req: Request, res: Response) => {
  try {
    const sessionId = req.body.session_id;
    const accessToken = req.body.access_token;
    const refreshToken = req.body.refresh_token;
    const cid = sessionId.split("-")[0];
    const fname = sessionId.split("-")[1];
    const lname = sessionId.split("-")[2];
    const newSessionId = `${sessionId.split("-")[3]}`;
    // 1100400728564-ณภัทรวัฒน์-สามพวงทอง-0e5de8a5-82a5-4216-9b80-362f43e5dda9


    // save session for verify
    const rs: any = await requestModel.getProfile(accessToken);
    if (rs.cid) {
      if (rs.cid == cid) {
        // const info: any = await requestModel.getUser(req.db, rs.cid);
        console.log(newSessionId, cid);
        const checkss: any = await requestModel.checkSession(req.db, newSessionId, cid);
        await requestModel.removeSession(req.db, newSessionId, cid);
        if (checkss.length) {
          const passwordInternet = await generator.generate({
            length: 20,
            numbers: true
          });

          const obj: any = {
            cid: cid,
            first_name: fname,
            last_name: lname,
            session_id: newSessionId
          }
          const vf: any = await requestModel.verifyKycDipchip(obj);
          if (vf.ok) {

            let isCreate: any = false;
            try {
              let _isCreate: any = await requestModel.generateUserInternet({
                "firstName": fname,
                "lastName": lname,
                "password": passwordInternet,
                "cid": cid,
                "type": "MYMOPH"
              });

              if (!_isCreate.ok) {
                if (_isCreate.error_code == 'ER_DUP_ENTRY') {
                  _isCreate = await requestModel.changePasswordInternet(cid, {
                    "password": passwordInternet
                  })
                }
              }
              isCreate = _isCreate.ok;
            } catch (error) {
              console.log(error);
            } await requestModel.updateUser(req.db, rs.cid,
              {
                password_internet: passwordInternet,
                is_ekyc: 'Y',
                is_created_ldap: isCreate ? 'Y' : 'N'
              });
            res.send({ ok: true });
          } else {
            res.status(500);
            res.send({ ok: false, error: 'ติดต่อฐานข้อมูลสมาชิกไม่ได้' });
          }
        } else {
          res.status(500);
          // not found
          res.send({ ok: false, error: 'Qrcode นี้ใช้งานไม่ได้ กรุณาลองใหม่อีกครั้ง' });
        }
      } else {
        console.log('cid!=cid');
        res.status(500);
        res.send({ ok: false, error: 'ข้อมูลไม่ตรง กรุณาลองใหม่อีกครั้ง' });
      }
    } else {
      console.log('errgetpf');
      res.status(500);
      res.send({ ok: false, error: 'Access denied' });
    }
  } catch (error) {
    console.log(error);
    res.status(500);
    res.send({ ok: false });
  }
});

export default router;