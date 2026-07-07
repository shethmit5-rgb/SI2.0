const { body, param, query } = require("express-validator");
const mongoose = require("mongoose");
const {
  validateEmail,
  validatePassword,
  validateName,
} = require("../utils/validators");

// Reusable chains
const emailChain = (fieldName = "email", isRequired = true) => {
  let chain = body(fieldName);
  if (isRequired) {
    chain = chain.notEmpty().withMessage("Email is required");
  } else {
    chain = chain.optional();
  }
  return chain.custom((value) => {
    if (!value && !isRequired) return true;
    const error = validateEmail(value);
    if (error) throw new Error(error);
    return true;
  }).normalizeEmail();
};

const passwordChain = (fieldName = "password", isRequired = true) => {
  let chain = body(fieldName);
  if (isRequired) {
    chain = chain.notEmpty().withMessage("Password is required");
  } else {
    chain = chain.optional();
  }
  return chain.custom((value) => {
    if (!value && !isRequired) return true;
    const error = validatePassword(value);
    if (error) throw new Error(error);
    return true;
  });
};

const nameChain = (fieldName = "name", isRequired = true) => {
  let chain = body(fieldName);
  if (isRequired) {
    chain = chain.notEmpty().withMessage("Name is required");
  } else {
    chain = chain.optional();
  }
  return chain.custom((value) => {
    if (!value && !isRequired) return true;
    const error = validateName(value);
    if (error) throw new Error(error);
    return true;
  }).trim();
};

const phoneChain = (fieldName = "phoneNumber", isRequired = true) => {
  let chain = body(fieldName);
  if (isRequired) {
    chain = chain.notEmpty().withMessage("Phone number is required");
  } else {
    chain = chain.optional();
  }
  return chain.custom((value) => {
    if (!value && !isRequired) return true;
    if (!value) {
      if (isRequired) throw new Error("Phone number is required");
      return true;
    }
    if (!/^\+[1-9]\d{1,14}$/.test(value)) {
      throw new Error("Valid phone number with country code is required (e.g. +919876543210)");
    }
    return true;
  }).trim();
};

const mongoIdChain = (location = "body", fieldName = "id", message = "Invalid ID format") => {
  let chain;
  if (location === "param") {
    chain = param(fieldName);
  } else if (location === "query") {
    chain = query(fieldName);
  } else {
    chain = body(fieldName);
  }
  return chain.custom((value) => {
    if (!value) return true;
    if (!mongoose.Types.ObjectId.isValid(value)) {
      throw new Error(message);
    }
    return true;
  });
};

const requiredMongoIdChain = (location = "body", fieldName = "id", message = "Invalid ID format") => {
  let chain;
  if (location === "param") {
    chain = param(fieldName);
  } else if (location === "query") {
    chain = query(fieldName);
  } else {
    chain = body(fieldName);
  }
  return chain
    .notEmpty()
    .withMessage(`${fieldName} is required`)
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error(message);
      }
      return true;
    });
};

const numberChain = (fieldName, min = 0, max = 10000000, isRequired = true, isInteger = false) => {
  let chain = body(fieldName);
  if (isRequired) {
    chain = chain.notEmpty().withMessage(`${fieldName} is required`);
  } else {
    chain = chain.optional({ nullable: true, checkFalsy: true });
  }
  
  chain = chain.custom((value) => {
    if (value === undefined || value === null || value === "") {
      if (isRequired) throw new Error(`${fieldName} is required`);
      return true;
    }
    const num = Number(value);
    if (isNaN(num)) {
      throw new Error(`${fieldName} must be a number`);
    }
    if (num < min) {
      throw new Error(`${fieldName} must be at least ${min}`);
    }
    if (num > max) {
      throw new Error(`${fieldName} must be less than ${max}`);
    }
    if (isInteger && !Number.isInteger(num)) {
      throw new Error(`${fieldName} must be an integer`);
    }
    return true;
  });
  
  return chain;
};

const dateChain = (fieldName, isRequired = true) => {
  let chain = body(fieldName);
  if (isRequired) {
    chain = chain.notEmpty().withMessage(`${fieldName} is required`);
  } else {
    chain = chain.optional();
  }
  return chain.custom((value) => {
    if (!value && !isRequired) return true;
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid ${fieldName}`);
    }
    return true;
  });
};

const enumChain = (fieldName, allowedValues, isRequired = true, location = "body") => {
  let chain;
  if (location === "param") {
    chain = param(fieldName);
  } else if (location === "query") {
    chain = query(fieldName);
  } else {
    chain = body(fieldName);
  }
  if (isRequired) {
    chain = chain.notEmpty().withMessage(`${fieldName} is required`);
  } else {
    chain = chain.optional();
  }
  return chain.custom((value) => {
    if (!value && !isRequired) return true;
    if (!allowedValues.includes(value)) {
      throw new Error(`Invalid value for ${fieldName}. Allowed values: ${allowedValues.join(", ")}`);
    }
    return true;
  });
};

module.exports = {
  emailChain,
  passwordChain,
  nameChain,
  phoneChain,
  mongoIdChain,
  requiredMongoIdChain,
  numberChain,
  dateChain,
  enumChain
};
