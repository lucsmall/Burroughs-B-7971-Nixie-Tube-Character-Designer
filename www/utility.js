function pad_left(str, pad_string, length) {
  while (str.length < length) {
    str = pad_string + str;
  }
  return str;
}

 function value_as_hex(value)
 {
    return "0x" + pad_left(value.toString(16), "0", 4);
 }

 function value_as_binary(value)
 {
    return "0b" + pad_left(value.toString(2), "0", 16);
 }