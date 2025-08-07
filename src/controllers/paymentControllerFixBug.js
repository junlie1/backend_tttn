const qs = require("querystring");
const crypto = require('crypto');
const moment = require('moment');

function sortObject(obj) {
    let sorted = {};
    let keys = Object.keys(obj).sort();
    keys.forEach((key) => {
        sorted[key] = obj[key];
    });
    return sorted;
}

const paymentController = {
    createPaymentUrl: (req, res) => {
        const { amount } = req.query;
        console.log(typeof amount);

        const tmnCode = "MTV05YVA"; // Lấy từ VNPay .env
        const secretKey = "PBNLKF8YGRNCPXLDJLY9V1023CW8206U"; // Lấy từ VNPay

        const returnUrl = "http://localhost:5000/api/payment/vnpay_return"; // Trang kết quả
        const vnp_Url = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";

        let ipAddr = req.ip;
        let orderId = moment().format("YYYYMMDDHHmmss");
        let bankCode = req.query.bankCode || "NCB";

        let createDate = moment().format("YYYYMMDDHHmmss");
        let orderInfo = "ThanhtoánvéxechotuyếnTỉnhA-TỉnhB-Họtên:NguyễnVănA,SĐT:0901234567";
        let locale = req.query.language || "vn";
        let currCode = "VND";

        let vnp_Params = {
            vnp_Version: "2.1.0",
            vnp_Command: "pay",
            vnp_TmnCode: tmnCode,
            vnp_Locale: locale,
            vnp_CurrCode: currCode,
            vnp_TxnRef: orderId,
            vnp_OrderInfo: orderInfo,
            vnp_OrderType: "other",
            vnp_Amount: amount * 100,
            vnp_ReturnUrl: returnUrl,
            vnp_IpAddr: ipAddr,
            vnp_CreateDate: createDate,
        };

        if (bankCode !== "") {
            vnp_Params["vnp_BankCode"] = bankCode;
        }

        vnp_Params = sortObject(vnp_Params);

        let signData = qs.stringify(vnp_Params);
        let hmac = crypto.createHmac("sha512", secretKey);
        let signed = hmac.update(new Buffer.from(signData, "utf-8")).digest("hex");
        vnp_Params["vnp_SecureHash"] = signed;

        let paymentUrl = vnp_Url + "?" + qs.stringify(vnp_Params);
        res.json({ paymentUrl });
    },
    vnpayReturn: (req, res) => {
        const query = req.query;
        const secretKey = "PBNLKF8YGRNCPXLDJLY9V1023CW8206U";
        const vnp_SecureHash = query.vnp_SecureHash;

        delete query.vnp_SecureHash;
        const signData = qs.stringify(query);

        const hmac = crypto.createHmac("sha512", secretKey);
        const checkSum = hmac.update(signData).digest("hex");
        console.log(query);

        if (vnp_SecureHash === checkSum) {
            if (query.vnp_ResponseCode === "00") {
                res.json({ message: "Thanh toán thành công", data: query });
            } else {
                res.json({ message: "Thanh toán thất bại", data: query });
            }
        } else {
            res.status(400).json({ message: "Dữ liệu không hợp lệ" });
        }
    }
}

module.exports = paymentController;