
const COMMUNICATON_INTERVAL_MSEC=30;
const MEMMAP_TBL={
  "PRODUCT_ID":   0,
  "VERSION_ID":   1,
  "EXEC_MODE":    2,
  "SEQ_COUNT_MSB":3,
  "SEQ_COUNT_LSB":4,
  "RANDOM":       5,
  "TIMER":        6,
  "TEMP":         7,
  "HUM":          8,
  "BUZZER_TONE":  9,
  "BUZZER_TIME":  10,
  "SENSOR1_VAL":  11,
  "SENSOR2_VAL":  12,
  "SENSOR3_VAL":  13,
  "SENSOR4_VAL":  14,
  "LED1_VAL":     15,
  "LED2_VAL":     16,
  "SW_VAL":       17,
  "VAR1":         18,
  "VAR2":         19,
  "VAR3":         20,
  "VAR4":         21,
  "VAR5":         22,
  "VAR6":         23,
  "VAR7":         24,
  "VAR8":         25,
  "LOOP1":        26,
  "LOOP2":        27,
  "LOOP3":        28,
  "LOOP4":        29,
  "LOOP5":        30,
  "LOOP6":        31,
  "LOOP7":        32,
  "LOOP8":        33,
  "MEMMAP_SIZE":  34,
};

const MEMMAP_TBL_BLOCK=[
  ["PRODUCT_ID",   0],
  ["VERSION_ID",   1],
  ["EXEC_MODE",    2],
  ["SEQ_COUNT_MSB",3],
  ["SEQ_COUNT_LSB",4],
  ["ランダム",      5],
  ["時間",          6],
  ["気温",          7],
  ["湿度",          8],
  ["ブザー音程",    9],
  ["ブザー時間",    10],
  ["センサ1",       11],
  ["センサ2",       12],
  ["センサ3",       13],
  ["センサ4",       14],
  ["LED1",         15],
  ["LED2",         16],
  ["スイッチ",      17],
  ["変数1",         18],
  ["変数2",         19],
  ["変数3",         20],
  ["変数4",         21],
  ["変数5",         22],
  ["変数6",         23],
  ["変数7",         24],
  ["変数8",         25],
];

const CODE_MAP={
  RC_STOP       :0x80,  /* 停止                 RC_STOP          */
  RC_JUMP       :0x81,  /* ジャンプ             RC_JUMP adr.w    */
  RC_CALL       :0x82,  /* コール               RC_CALL adr.l    */
  RC_RET        :0x83,  /* リターン             RC_RET           */
  RC_WAIT_W     :0x89,  /* 固定時間待ち         RC_WAIT_B data.w */
  RC_MEMW_B     :0x90,  /* メモリ書き込み       RC_MEM_W adr.b length.b data0.b data1.b ... */
  RC_C_INIT     :0xc0,  /* 計算 スタック初期化  RC_C_INIT        */
  RC_C_DUP      :0xc1,  /* 計算 値の複製        RC_C_DUP         */
  RC_C_C_L      :0xc4,  /* 計算 定数            RC_C_L data.b    */
  RC_C_MR_B     :0xc8,  /* 計算 メモリ読み出し  RC_C_MR_B adr.b  */
  RC_C_MW_B     :0xcc,  /* 計算 メモリ書き込み  RC_C_MW_B adr.b  */
  RC_C_ADD      :0xd0,  /* 計算 加算            RC_C_ADD         */
  RC_C_SUB      :0xd1,  /* 計算 減算            RC_C_SUB         */
  RC_C_MUL      :0xd2,  /* 計算 乗算            RC_C_MUL         */
  RC_C_DIV      :0xd3,  /* 計算 除算            RC_C_DIV         */
  RC_C_MOD      :0xd4,  /* 計算 余り            RC_C_MOD         */
  RC_C_AND      :0xd5,  /* 計算 ビットAND       RC_C_AAND        */
  RC_C_OR       :0xd6,  /* 計算 ビットOR        RC_C_AOR         */
  RC_C_XOR      :0xd7,  /* 計算 ビットXOR       RC_C_AXOR        */
  RC_C_NOT      :0xd8,  /* 計算 ビットNOT       RC_C_ANOT        */
  RC_C_EQ       :0xd9,  /* 計算 =               RC_C_EQ          */
  RC_C_NE       :0xda,  /* 計算 !=              RC_C_NE          */
  RC_C_GT       :0xdb,  /* 計算 >               RC_C_GT          */
  RC_C_GE       :0xdc,  /* 計算 >=              RC_C_GE          */
  RC_C_LT       :0xdd,  /* 計算 <               RC_C_LT          */
  RC_C_LE       :0xde,  /* 計算 <=              RC_C_LE          */
  RC_C_JUMP     :0xe0,  /* 計算 真ならジャンプ  RC_C_JUMP adr.w  */
};

const APP_PLATFORM={
  NORMAL:0,
  WINDOWS:1,
  IOS:2
}

ROBOT={
    memmap:new Array(MEMMAP_TBL["MEMMAP_SIZE"]),
    port:null,
    wbuff:{},
    wbuff_raw:null,
    rbuff:"",
    isWriting:false,
    defaultSpd:0x40,
    iswritedcode:false,
    codewriteerror:false,
    lastwrotecode:[],
    writeprogress:0,
    app_platrofm_mode:APP_PLATFORM.NORMAL,
    isconnect_win:false
}

function set_windows_appmode(flag){
  if(flag==true) ROBOT.app_platrofm_mode=APP_PLATFORM.WINDOWS;
  else ROBOT.app_platrofm_mode=APP_PLATFORM.NORMAL;
  console.log("set_windows_appmode");
  return "true";
}

function set_ios_appmode(flag){
  if(flag==true) ROBOT.app_platrofm_mode=APP_PLATFORM.IOS;
  else ROBOT.app_platrofm_mode=APP_PLATFORM.NORMAL;
  console.log(`set_ios_appmode`);
  return "true";
}

function set_isconnect_win(flag){
  ROBOT.isconnect_win=flag;
  console.log("set_isconnect_win");
  return "true";
}

function parserecvcmd(buf){
  ROBOT.parserecvcmd(buf);
  return "true";
}




ROBOT.updateMemmapHtml = function(){
  if(ROBOT.isconnected()){
    for(var i=0;i<MEMMAP_TBL_BLOCK.length;i++)
    {
      var elem = document.getElementById(`memmap_${i}`);
      if(elem) elem.innerText = ROBOT.memmap[i];
    }
  }
  else{
    for(var i=0;i<MEMMAP_TBL_BLOCK.length;i++)
    {
      var elem = document.getElementById(`memmap_${i}`);
      if(elem) elem.innerText = '--';
    }
  }

}

ROBOT.makeMemmapHtml = function(){
  
  var html = `<div class="container"><table>\n`;
  for(var i=0;i<MEMMAP_TBL_BLOCK.length;i++)
  {
    html += `<tr><th>${MEMMAP_TBL_BLOCK[i][0]}</th><td><label id="memmap_${i}">--</td></tr>\n`;
  }
  html += "<table></div>";
  return html;
}

ROBOT.getaddrfromname = function(paramname){
  if(!(paramname in MEMMAP_TBL)) return -1;
  return MEMMAP_TBL[paramname];
}

ROBOT.getnamefromaddr = function(addr){
  for(let name in MEMMAP_TBL){
    if(addr==MEMMAP_TBL[name]) return name;
  }
  return null;
}

ROBOT.getmemmapsize = function(){
  return MEMMAP_TBL["MEMMAP_SIZE"];
}

ROBOT.getmemmapfielddropdown = function(){
  var ret = [];
  for(let i in MEMMAP_TBL_BLOCK){
    ret.push( [ MEMMAP_TBL_BLOCK[i][0] , MEMMAP_TBL_BLOCK[i][1].toString() ] );
  }
  return ret;
}


ROBOT.isconnected = function(){
  if(ROBOT.app_platrofm_mode==APP_PLATFORM.WINDOWS) return ROBOT.isconnect_win;
  else if(ROBOT.app_platrofm_mode==APP_PLATFORM.IOS) return ROBOT.isconnect_win;
  else return ROBOT.port!=null;  
}



ROBOT.stopPlay = function(){
  if(ROBOT.isconnected()){
    ROBOT.writeReq({
      EXEC_MODE:4
    });
  }
}

ROBOT.startPlay = function(){
  if(ROBOT.isconnected()){
    ROBOT.prepareringPlay=true;
    ROBOT.wbuff_raw = `w ${itohex(MEMMAP_TBL.EXEC_MODE)} ${itohex(1)}${itohex(Math.floor(MEMMAP_TBL.MEMMAP_SIZE/256))}${itohex(Math.floor(MEMMAP_TBL.MEMMAP_SIZE%256))}\n`
  }
}

ROBOT.port_send = function(buf){
  if(ROBOT.app_platrofm_mode==APP_PLATFORM.WINDOWS) chrome.webview.hostObjects.class.send(buf);
  else if(ROBOT.app_platrofm_mode==APP_PLATFORM.IOS) webkit.messageHandlers.send.postMessage(buf);
  else{
    let bytearray = new TextEncoder().encode(buf);
    ROBOT.port.send(bytearray);
  }
}

ROBOT.send = function() {
    'use strict';
    if (!ROBOT.isconnected()) {
      return;
    }

    if(ROBOT.wbuff_raw){
      ROBOT.port_send(ROBOT.wbuff_raw);
      ROBOT.wbuff_raw=null;
    }
    else if(ROBOT.wbuff){
      var wbuff = JSON.parse(JSON.stringify(ROBOT.wbuff));
      ROBOT.wbuff=null;
  
      for(let mem in wbuff){
        var adr = ROBOT.getaddrfromname(mem);
        var val = wbuff[mem];
        var wstr=`W ${itohex(adr)} ${itohex(val)}\n`;

        ROBOT.port_send(wstr);
      }
    }


};

ROBOT.read = function() {
  'use strict';
  if (!ROBOT.isconnected()) {
    return;
  }

  var wstr=`r 00 ${ROBOT.getmemmapsize().toString(16).toUpperCase()}\n`;
  ROBOT.port_send(wstr);

};

ROBOT.parserecvcmd = function(buf){

  ROBOT.rbuff += buf;
  if(ROBOT.rbuff.indexOf('>')>=0) {
    var rbuff = ROBOT.rbuff;
    ROBOT.rbuff="";
    //正規表現で読み込みコマンドにマッチしたらメモリマップに反映
  
    try{
      if(rbuff.match(/r [0-9|a-f|A-F]{2} [0-9|a-f|A-F]{2}\n/g)){
        recv = rbuff.split('\r\n').filter(Boolean);
        if(recv.length>=2 && recv[1].match(/([0-9|a-f|A-F]{2} )+/g)){
          var adr=parseInt( recv[0].match(/[0-9|a-f|A-F]{2}/g)[0],16);
          var match = recv[1].match(/[0-9|a-f|A-F]{2} /g);
    
    
          for(hex of match){
            var adrname = ROBOT.getnamefromaddr(adr);
            if(!adrname) break;
    
            var val = parseInt(hex, 16);
    
            ROBOT.memmap[adr] = val;
            adr++;
          }
        }
      }
      else{
        var puttext = rbuff.match(/P [0-9|a-f|A-F]{2} [0-9|a-f|A-F]+/g);
        if(puttext){
          var progress_step = 100/ROBOT.lastwrotecode.length;
          var now_progress = 0;
          for(let w in ROBOT.lastwrotecode){
            if(ROBOT.lastwrotecode[w].indexOf(puttext)>=0){

              now_progress = progress_step*(w+1);
              if(w==ROBOT.lastwrotecode.length-1){
                ROBOT.iswritedcode=true;
                ROBOT.lastwrotecode=[];
                break;
              } 
            }
          }
          if(ROBOT.writeprogress<now_progress) ROBOT.writeprogress=now_progress;
        } 
      } 
    
    }
    catch(e){
      console.log(e);
    }
  
  }
}

ROBOT.conn = function(){
    'use strict';

    if(ROBOT.app_platrofm_mode==APP_PLATFORM.WINDOWS) chrome.webview.hostObjects.class.connect_toggle();
    else if(ROBOT.app_platrofm_mode==APP_PLATFORM.IOS) webkit.messageHandlers.connect_toggle.postMessage("dammy");
    else{
      function connect() {
        ROBOT.port.connect().then(() => {

          ROBOT.writeReq({
            EXEC_MODE:4
          });
          
          ROBOT.port.onReceive = data => {
            let textDecoder = new TextDecoder();
            var recvstr = textDecoder.decode(data);
            ROBOT.parserecvcmd(recvstr);
          }
          ROBOT.port.onReceiveError = error => {
            console.error(error);
          };
        }, error => {
            console.log(error);
        });
      }

      if (ROBOT.isconnected()) {
        ROBOT.port.disconnect();
        ROBOT.port = null;
      } else {
        serial.requestPort().then(selectedPort => {
          ROBOT.port = selectedPort;

          connect();
        }).catch(error => {
            console.log(error);
        });
      }
    }
}

ROBOT.thread = function(){
  if(ROBOT.isconnected() && !ROBOT.isWriting){
    ROBOT.send();
    ROBOT.read();
  }
  setTimeout(ROBOT.thread, document.getElementById('comm_interval').value);
}

ROBOT.isPlaying = function(){
  if(!ROBOT.isconnected()) return false;
  else{
    var isPlaying = ROBOT.memmap[MEMMAP_TBL.EXEC_MODE]==1 || ROBOT.memmap[MEMMAP_TBL.EXEC_MODE]==2 || ROBOT.memmap[MEMMAP_TBL.EXEC_MODE]==3;
    if(isPlaying) ROBOT.prepareringPlay = false;
    return ROBOT.prepareringPlay || isPlaying;
  } 
}

ROBOT.getIsWriting = function(){
  return ROBOT.writeHandle || ROBOT.lastwrotecode.length>0;
}

ROBOT.stopWrite = function(){
  if(ROBOT.isconnected()){
    if(ROBOT.writeHandle){
      clearInterval(ROBOT.writeHandle);
    } 
  }
}

ROBOT.writeSeq = function(){
  ROBOT.lastwrotecode=[];
  ROBOT.writeprogress=0;
  if(ROBOT.isconnected() && BLOCKAREA.code.length>0){
    ROBOT.writeHandle= setInterval(function() {
      if(!ROBOT.isWriting){
        ROBOT.isWriting=true;

        clearInterval(ROBOT.writeHandle);
        ROBOT.writeHandle=null;

        const WRITEBLOCKBYTE=32;
        for(var i=0;i<BLOCKAREA.code.length;i+=WRITEBLOCKBYTE){
          var send = BLOCKAREA.code.substring(i,i+WRITEBLOCKBYTE<BLOCKAREA.code.length? i+WRITEBLOCKBYTE : BLOCKAREA.code.length);

          var adr = (i/2)+MEMMAP_TBL.MEMMAP_SIZE;
          var wstr=`P ${adr.toString(16).toUpperCase()} ${send}\n`;

          ROBOT.port_send(wstr);
          ROBOT.lastwrotecode.push(wstr);
    
        }
        BLOCKAREA.code="";

        ROBOT.isWriting=false;

        return ;
      }
    },30);
  }
}

ROBOT.writeReq = function(wbuff){
  if(!ROBOT.wbuff) ROBOT.wbuff={};
  ROBOT.wbuff = Object.assign(ROBOT.wbuff,wbuff);
}


ROBOT.getseqpos = function(){
  if(ROBOT.isconnected()){
    return ROBOT.memmap[MEMMAP_TBL.SEQ_COUNT_MSB]*0x100 + ROBOT.memmap[MEMMAP_TBL.SEQ_COUNT_LSB];
  }
  return 0;
}