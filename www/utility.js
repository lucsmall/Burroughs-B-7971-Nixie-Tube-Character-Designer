function pad_left(str, pad_string, length) {
  while (str.length < length) {
    str = pad_string + str;
  }
  return str;
}
