// Licensed to the Software Freedom Conservancy (SFC) under one
// or more contributor license agreements.  See the NOTICE file
// distributed with this work for additional information
// regarding copyright ownership.  The SFC licenses this file
// to you under the Apache License, Version 2.0 (the
// "License"); you may not use this file except in compliance
// with the License.  You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.

import LocationEmitter from "./location";
import SelectionEmitter from "./selection";

const emitters = {
  open: emitOpen,
  click: emitClick,
  clickAt: emitClick,
  doubleClick: emitDoubleClick,
  doubleClickAt: emitDoubleClick,
  dragAndDropToObject: emitDragAndDrop,
  type: emitType,
  sendKeys: emitType,
  echo: emitEcho,
  runScript: emitRunScript,
  pause: emitPause,
  verifyText: emitVerifyText,
  verifyTitle: emitVerifyTitle,
  assertText: emitVerifyText,
  assertTitle: emitVerifyTitle,
  store: emitStore,
  storeText: emitStoreText,
  storeTitle: emitStoreTitle,
  select: emitSelect,
  addSelection: emitSelect,
  removeSelection: emitSelect,
  selectFrame: emitSelectFrame,
  selectWindow: emitSelectWindow,
  mouseDown: emitMouseDown,
  mouseDownAt: emitMouseDown,
  mouseUp: emitMouseUp,
  mouseUpAt: emitMouseUp,
  mouseMove: emitMouseMove,
  mouseMoveAt: emitMouseMove,
  mouseOver: emitMouseMove,
  mouseOut: emitMouseOut,
  assertAlert: emitAssertAlert,
  assertPrompt: emitAssertAlert,
  assertConfirmation: emitAssertAlert,
  answerOnNextPrompt: emitAnswerOnNextPrompt,
  editContent: emitEditContent
};

export function emit(command) {
  return new Promise(async (res, rej) => {
    if (emitters[command.command]) {
      try {
        let result = await emitters[command.command](command.target, command.value);
        res(result);
      } catch (e) {
        rej(e);
      }
    } else {
      rej(command.command ? `Unknown command ${command.command}` : "Command can not be empty");
    }
  });
}

export default {
  emit
};

function emitOpen(target) {
  return Promise.resolve(`driver.get(BASE_URL + "${target}");`);
}

async function emitClick(target) {
  return Promise.resolve(`driver.findElement(${await LocationEmitter.emit(target)}).then(element => {driver.actions().click(element).perform();});`);
}

async function emitDoubleClick(target) {
  return Promise.resolve(`driver.findElement(${await LocationEmitter.emit(target)}).then(element => {driver.actions().doubleClick(element).perform();});`);
}

async function emitDragAndDrop(dragged, dropzone) {
  return Promise.resolve(`driver.findElement(${await LocationEmitter.emit(dragged)}).then(dragged => {driver.findElement(${await LocationEmitter.emit(dropzone)}).then(dropzone => {driver.actions().dragAndDrop(dragged, dropzone).perform();});});`);
}

async function emitType(target, value) {
  return Promise.resolve(`driver.findElement(${await LocationEmitter.emit(target)}).then(element => {driver.actions().click(element).sendKeys(\`${value}\`).perform();});`);
}

async function emitEcho(message) {
  return Promise.resolve(`console.log(\`${message}\`);`);
}

async function emitRunScript(script) {
  return Promise.resolve(`driver.executeScript(\`${script}\`);`);
}

async function emitPause(_, time) {
  return Promise.resolve(`driver.sleep(${time});`);
}

async function emitVerifyText(locator, text) {
  return Promise.resolve(`driver.findElement(${await LocationEmitter.emit(locator)}).then(element => {element.getText().then(text => {expect(text).toBe(\`${text}\`)});});`);
}

async function emitVerifyTitle(title) {
  return Promise.resolve(`driver.getTitle().then(title => {expect(title).toBe(\`${title}\`);});`);
}

async function emitStore(value, varName) {
  return Promise.resolve(`var ${varName} = "${value}";`);
}

async function emitStoreText(locator, varName) {
  return Promise.resolve(`var ${varName};driver.findElement(${await LocationEmitter.emit(locator)}).then(element => {element.getText().then(text => {${varName} = text;});});`);
}

async function emitStoreTitle(_, varName) {
  return Promise.resolve(`var ${varName};driver.getTitle().then(title => {${varName} = title;});`);
}

async function emitSelect(selectElement, option) {
  return Promise.resolve(`driver.findElement(${await LocationEmitter.emit(selectElement)}).then(element => {element.findElement(${await SelectionEmitter.emit(option)}).then(option => {option.click();});});`);
}

async function emitSelectFrame(frameLocation) {
  if (frameLocation === "relative=top") {
    return Promise.resolve("driver.switchTo().frame();");
  } else if (/^index=/.test(frameLocation)) {
    return Promise.resolve(`driver.switchTo().frame(${frameLocation.split("index=")[1]});`);
  } else {
    return Promise.resolve(`driver.findElement(${await LocationEmitter.emit(frameLocation)}).then(frame => {driver.switchTo().frame(frame);});`);
  }
}

function emitSelectWindow(windowLocation) {
  if (/^name=/.test(windowLocation)) {
    return Promise.resolve(`driver.switchTo().window("${windowLocation.split("name=")[1]}");`);
  } else {
    return Promise.reject("Can only emit `select window` using name locator");
  }
}

async function emitMouseDown(locator) {
  return Promise.resolve(`driver.findElement(${await LocationEmitter.emit(locator)}).then(element => {driver.actions().mouseDown(element).perform();});`);
}

async function emitMouseUp(locator) {
  return Promise.resolve(`driver.findElement(${await LocationEmitter.emit(locator)}).then(element => {driver.actions().mouseUp(element).perform();});`);
}

async function emitMouseMove(locator) {
  return Promise.resolve(`driver.findElement(${await LocationEmitter.emit(locator)}).then(element => {driver.actions().mouseMove(element).perform();});`);
}

async function emitMouseOut(locator) {
  return Promise.resolve(`driver.findElement(${await LocationEmitter.emit(locator)}).then(element => {driver.actions().mouseMove(element, {x: -1, y: -1}).perform();});`);
}

function emitAssertAlert(alertText) {
  return Promise.resolve(`driver.switchTo().alert().then(alert => {alert.getText().then(text => {expect(text).toBe(${alertText});});});`);
}

function emitAnswerOnNextPrompt(textToSend) {
  return Promise.resolve(`driver.switchTo().alert().then(alert => {alert.sendKeys("${textToSend}");});`);
}

async function emitEditContent(locator, content) {
  return Promise.resolve(`driver.findElement(${await LocationEmitter.emit(locator)}).then(element => {driver.executeScript("if(arguments[0].contentEditable === 'true') {arguments[0].innerHTML = '${content}'}", element);});`);
}
