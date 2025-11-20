const cleanPayload = (payload = {}) => {
  const cleaned = {};
  Object.keys(payload).forEach((key) => {
    const value = payload[key];
    if (value !== '' && value !== null && value !== undefined) {
      cleaned[key] = value;
    }
  });
  return cleaned;
};

export default cleanPayload;
