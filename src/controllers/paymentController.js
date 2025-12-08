const crypto = require('crypto');
const moment = require('moment');
const { db } = require('../config/firebase');
require('dotenv').config();

function sortParams(obj) {
  const sortedObj = Object.entries(obj)
    .filter(
      ([key, value]) => value !== "" && value !== undefined && value !== null
    )
    .sort(([key1], [key2]) => key1.toString().localeCompare(key2.toString()))
    .reduce((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {});
  return sortedObj;
}

function buildSignData(obj) {
  const sorted = sortParams(obj);
  const keyVals = [];

  for (const [key, value] of Object.entries(sorted)) {
    if (value !== "" && value !== undefined && value !== null) {
      keyVals.push(
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`
      );
    }
  }

  return keyVals.join("&");
}

const paymentController = {
  createPaymentUrl: async (req, res) => {
    process.env.TZ = "Asia/Ho_Chi_Minh";
    const { orderId, amount, orderInfo, updatedPaymentData } = req.body;
    console.log("updatedPaymentData", updatedPaymentData);


    const numericAmount = parseInt(amount.replace(/\D/g, ""), 10);
    const createDate = moment().format("YYYYMMDDHHmmss");
    const expireDate = moment().add(15, "minutes").format("YYYYMMDDHHmmss");

    let vnp_Params = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode: process.env.VNP_TMCODE,
      vnp_Locale: "vn",
      vnp_CurrCode: "VND",
      vnp_TxnRef: orderId,
      vnp_OrderInfo: "Thanhtoan",
      vnp_OrderType: "other",
      vnp_Amount: numericAmount * 100,
      vnp_ReturnUrl: process.env.VNP_RETURN_URL,
      vnp_IpAddr: "127.0.0.1",
      vnp_CreateDate: createDate,
      vnp_ExpireDate: expireDate,
    };

    const signData = buildSignData(vnp_Params);
    const signed = crypto
      .createHmac("sha512", process.env.VNP_HASH_SECRET)
      .update(Buffer.from(signData, "utf-8"))
      .digest("hex")
      .toUpperCase();   // ⬅️ thêm cái này

    vnp_Params.vnp_SecureHash = signed;
    const paymentUrl = `${process.env.VNP_URL}?${new URLSearchParams(vnp_Params).toString()}`;
    console.log("TMN =", process.env.VNP_TMCODE);
    console.log("HASH =", process.env.VNP_HASH_SECRET);
    console.log("signData =", signData);
    console.log("signed   =", signed);
    console.log("paymentUrl =", paymentUrl);
    const formattedTicket = {
      orderId,
      arrivalTime: updatedPaymentData.selectedSchedule.arrivalTime,
      bookingTime: moment().format(),
      busId: updatedPaymentData.selectedSchedule.busId,
      customerName: updatedPaymentData.userData.displayName ? updatedPaymentData.userData.displayName : updatedPaymentData.userData.name,
      customerId: updatedPaymentData.userData.uid,
      customerInfo: updatedPaymentData.userData.phoneNumber,
      departureTime: updatedPaymentData.selectedSchedule.departureTime,
      from: updatedPaymentData.route.startPoint,
      to: updatedPaymentData.route.endPoint,
      price: numericAmount,
      routeId: updatedPaymentData.routeId,
      scheduleId: updatedPaymentData.selectedSchedule.id,
      seatLayoutId: updatedPaymentData.selectedSchedule.seatLayoutId,
      seatNumber: updatedPaymentData.selectedSeats,
      status: "pending", // 🚨 Thanh toán chưa hoàn tất,
      vendorId: updatedPaymentData.selectedSchedule.vendorId
    };

    await db.collection("tickets").doc(orderId).set(formattedTicket);
    console.log("✅ Ticket saved in Firestore with status 'pending'.");

    res.json({ success: true, paymentUrl });
  },

  vnpayReturn: async (req, res) => {
    const { vnp_ResponseCode, vnp_TxnRef } = req.query;
    console.log("🔄 VNPay Return - Query:", req.query);

    try {
      if (!vnp_ResponseCode || !vnp_TxnRef) {
        return res.status(400).json({ success: false, message: "Thiếu mã phản hồi từ VNPay" });
      }

      let redirectUrl = "https://selling-clothes-website-five.vercel.app/failed";
      if (vnp_ResponseCode === "00") {
        // 🔹 **Lấy vé từ Firestore (dựa vào orderId)**
        const ticketRef = db.collection("tickets").doc(vnp_TxnRef);
        const ticketDoc = await ticketRef.get();
        if (!ticketDoc.exists) {
          return res.status(404).json({ success: false, message: "Không tìm thấy vé" });
        }

        let ticketData = ticketDoc.data();
        const seatLayoutId = ticketData.seatLayoutId;
        if (!seatLayoutId) {
          return res.status(500).json({ success: false, message: "Thiếu seatLayoutId trong vé" });
        }

        // 🔹 **Cập nhật sơ đồ ghế trong Firestore**
        const seatLayoutRef = db.collection("seatLayouts").doc(seatLayoutId);
        const seatLayoutDoc = await seatLayoutRef.get();
        if (!seatLayoutDoc.exists) {
          return res.status(404).json({ success: false, message: "Không tìm thấy sơ đồ ghế" });
        }

        let seatLayoutData = seatLayoutDoc.data();
        const bookedSeats = ticketData.seatNumber;
        const customerName = ticketData.customerName;
        const customerPhoneNumber = ticketData.customerInfo;

        console.log("🔄 Cập nhật sơ đồ ghế:", bookedSeats);

        const batch = db.batch();
        bookedSeats.forEach((seat) => {
          if (seatLayoutData.floor1 && seatLayoutData.floor1[seat]) {
            seatLayoutData.floor1[seat] = {
              ...seatLayoutData.floor1[seat],
              isBooked: true,
              bookedBy: customerName,
              customerInfo: customerPhoneNumber
            };
          } else if (seatLayoutData.floor2 && seatLayoutData.floor2[seat]) {
            seatLayoutData.floor2[seat] = {
              ...seatLayoutData.floor2[seat],
              isBooked: true,
              bookedBy: customerName,
              customerInfo: customerPhoneNumber
            };
          } else {
            console.log(`⚠ Ghế ${seat} không tồn tại`);
          }
        });

        batch.update(seatLayoutRef, seatLayoutData);
        await batch.commit();
        console.log("✅ Seat layout updated successfully.");

        // 🔹 **Cập nhật trạng thái vé thành "confirmed"**
        await ticketRef.update({ status: "booking" });
        console.log("✅ Ticket updated to 'booking'.");

        redirectUrl = `https://junwoan-gotta-go.vercel.app/success?orderId=${vnp_TxnRef}`;
      }

      console.log("🔄 Redirecting to:", redirectUrl);
      res.redirect(redirectUrl);
    } catch (error) {
      console.error("❌ Lỗi khi xử lý thanh toán:", error);
      return res.status(500).json({ success: false, message: "Lỗi server" });
    }
  },

  /**
   * Xử lý IPN từ VNPay
   * POST /vnpay_ipn
   */
  vnpayIpn: async (req, res) => {
    try {
      let vnp_Params = { ...req.body };
      const secureHash = vnp_Params["vnp_SecureHash"];
      delete vnp_Params["vnp_SecureHash"];
      delete vnp_Params["vnp_SecureHashType"];

      const signData = buildSignData(vnp_Params);
      const signed = crypto
        .createHmac("sha512", process.env.VNP_HASH_SECRET)
        .update(Buffer.from(signData, "utf-8"))
        .digest("hex")
        .toUpperCase();

      if (secureHash.trim().toLowerCase() === signed.trim().toLowerCase()) {
        return res.status(200).json({ RspCode: "00", Message: "Success" });
      } else {
        return res.status(200).json({ RspCode: "97", Message: "Fail checksum" });
      }
    } catch (err) {
      console.error("Error vnpay_ipn:", err);
      return res.status(500).json({ RspCode: "99", Message: "Unknown error" });
    }
  }
};

module.exports = paymentController;