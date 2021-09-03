//下記をコメントアウトするとiOS以外、コメントアウトを外すとiOS専用ファームに切り替え(要再ビルド)
//#define IOS
#ifdef  IOS
#include <MIDIUSB.h>
#else
#include <WebUSB.h>
#endif
#include <EEPROM.h>
#include <Wire.h>

#ifdef  IOS
//MIDI通信に関する定義
midiEventPacket_t midi_out;
bool flgSysExRemain = false;
#else
//webUSB通信に関する定義
WebUSB WebUSBSerial(1, "kimio-kosaka.github.io/webUSB-arduino/index.html");
bool isInitSerial=false;
#endif

//LED出力ピン定義
#define LED1_PIN  (9)
#define LED2_PIN  (6)

//スイッチ入力ピン定義
#define SW_PIN    (7)

//ブザー出力ピン定義
#define BUZZER_PIN  (10)

//ブザー音階定義
int tone_table[]={
 131, 139, 147, 156, 165, 175, 185, 196, 208, 220, 233, 247,
 262, 277, 294, 311, 330, 349, 370, 392, 415, 440, 466, 494,
 523, 554, 587, 622, 659, 698, 740, 784, 831, 880, 932, 988,  1047
};
bool isUpdateBuzzer=false;

//アナログ入力ピン定義
#define SN1_PIN   (A0)
#define SN2_PIN   (A1)
#define SN3_PIN   (A2)
#define SN4_PIN   (A3)

//プロンプト定義
#define PROMPT  ("\r\n>")

//ファームウェアバージョン定義
#define PROD_ID (1)
#define VERSION (1)

//メモリマップアドレス定義
#define PRODUCT_ID  (0)
#define VERSION_ID  (1)
#define EXEC_MODE   (2)
#define SEQ_COUNT_MSB   (3)
#define SEQ_COUNT_LSB   (4)
#define RANDOM      (5)
#define TIMER       (6)
#define TEMP        (7)
#define HUM         (8)
#define BUZZER_TONE (9)
#define BUZZER_TIME (10)
#define SENSOR1_VAL (11)
#define SENSOR2_VAL (12)
#define SENSOR3_VAL (13)
#define SENSOR4_VAL (14)
#define LED1_VAL    (15)
#define LED2_VAL    (16)
#define SW_VAL      (17)
#define VAR1        (18)
#define VAR2        (19)
#define VAR3        (20)
#define VAR4        (21)
#define VAR5        (22)
#define VAR6        (23)
#define VAR7        (24)
#define VAR8        (25)
#define LOOP1       (26)
#define LOOP2       (27)
#define LOOP3       (28)
#define LOOP4       (29)
#define LOOP5       (30)
#define LOOP6       (31)
#define LOOP7       (32)
#define LOOP8       (33)
#define MEMMAP_SIZE (34)

//メモリマップエリア定義
byte memmap[MEMMAP_SIZE];


//プログラムの実行コードコマンド定義
typedef enum {
  RC_STOP       =0x80,  // 停止
  RC_JUMP       =0x81,  // ジャンプ
  RC_CALL       =0x82,  // コール
  RC_RET        =0x83,  // リターン
  RC_WAIT_W     =0x89,  // 固定時間待ち
  RC_MEMW_B     =0x90,  // メモリ書き込み
  RC_C_INIT     =0xc0,  // 計算 スタック初期化
  RC_C_DUP      =0xc1,  // 計算 値の複製
  RC_C_C_L      =0xc4,  // 計算 定数
  RC_C_MR_B     =0xc8,  // 計算 メモリ読み出し
  RC_C_MR_W     =0xc9,  // 計算 メモリ読み出し
  RC_C_MR_L     =0xca,  // 計算 メモリ読み出し
  RC_C_MW_B     =0xcc,  // 計算 メモリ書き込み
  RC_C_MW_W     =0xcd,  // 計算 メモリ書き込み
  RC_C_MW_L     =0xce,  // 計算 メモリ書き込み
  RC_C_ADD      =0xd0,  // 計算 加算
  RC_C_SUB      =0xd1,  // 計算 減算
  RC_C_MUL      =0xd2,  // 計算 乗算
  RC_C_DIV      =0xd3,  // 計算 除算
  RC_C_MOD      =0xd4,  // 計算 余り
  RC_C_AND      =0xd5,  // 計算 ビットAND
  RC_C_OR       =0xd6,  // 計算 ビットOR
  RC_C_XOR      =0xd7,  // 計算 ビットXOR
  RC_C_NOT      =0xd8,  // 計算 ビットNOT
  RC_C_EQ       =0xd9,  // 計算 =
  RC_C_NE       =0xda,  // 計算 !=
  RC_C_GT       =0xdb,  // 計算 >
  RC_C_GE       =0xdc,  // 計算 >=
  RC_C_LT       =0xdd,  // 計算 <
  RC_C_LE       =0xde,  // 計算 <=
  RC_C_JUMP     =0xe0,  // 計算 真ならジャンプ
  RC_C_CALL     =0xe1,  // 計算 真ならコール
} rc_codetype;

//実行コードの状況定義
#define         EXEC_NONE       0       // 停止
#define         EXEC_START      1       // 開始要求
#define         EXEC_INEXEC     2       // 実行中
#define         EXEC_INWAIT     3       // wait中
#define         EXEC_STOP       4       // 停止要求


#define RECV_BUFF_LEN  (256)
char rbuff[RECV_BUFF_LEN];
int r_index=0;
int EEPROM_size;
unsigned long pre_time;
unsigned long counter=0;

#define STACK_SIZE  (16)
//実行コードの演算スタック
int stack[STACK_SIZE];
int stack_index=0;
bool calc_flag=false;
long wt=0;

#define CALL_SIZE  (16)
//サブルーチンのコールスタック
int call_adr[CALL_SIZE];
int call_index=0;

//BME280(温湿度/気圧センサ)関連の定義
#define BME280_ADDRESS 0x76
unsigned long int hum_raw,temp_raw,pres_raw;
signed long int t_fine;
 
uint16_t dig_T1;
 int16_t dig_T2;
 int16_t dig_T3;
uint16_t dig_P1;
 int16_t dig_P2;
 int16_t dig_P3;
 int16_t dig_P4;
 int16_t dig_P5;
 int16_t dig_P6;
 int16_t dig_P7;
 int16_t dig_P8;
 int16_t dig_P9;
 int8_t  dig_H1;
 int16_t dig_H2;
 int8_t  dig_H3;
 int16_t dig_H4;
 int16_t dig_H5;
 int8_t  dig_H6;

//BME280(温湿度/気圧センサ)の初期化
void setup_bme280()
{
    uint8_t osrs_t = 1;             //Temperature oversampling x 1
    uint8_t osrs_p = 1;             //Pressure oversampling x 1
    uint8_t osrs_h = 1;             //Humidity oversampling x 1
    uint8_t mode = 3;               //Normal mode
    uint8_t t_sb = 5;               //Tstandby 1000ms
    uint8_t filter = 0;             //Filter off 
    uint8_t spi3w_en = 0;           //3-wire SPI Disable
     
    uint8_t ctrl_meas_reg = (osrs_t << 5) | (osrs_p << 2) | mode;
    uint8_t config_reg    = (t_sb << 5) | (filter << 2) | spi3w_en;
    uint8_t ctrl_hum_reg  = osrs_h;
     
    Wire.begin();
     
    writeReg(0xF2,ctrl_hum_reg);
    writeReg(0xF4,ctrl_meas_reg);
    writeReg(0xF5,config_reg);
    readTrim();                    //
}



//メモリマップの初期化
void memmap_clear(){
  memset(memmap,0,sizeof(memmap));
  EEPROM.get(0,memmap);
  memmap[PRODUCT_ID] = PROD_ID;
  memmap[VERSION_ID] = VERSION;
  
  memmap[EXEC_MODE] = EXEC_NONE;
  memmap[SEQ_COUNT_MSB] = MEMMAP_SIZE>>8;
  memmap[SEQ_COUNT_LSB] = MEMMAP_SIZE&0xff;

  memset(rbuff,0,sizeof(rbuff));

}


void setup() {
  memmap_clear();
  pinMode(LED1_PIN, OUTPUT);
  pinMode(LED2_PIN, OUTPUT);
  pinMode(SW_PIN, INPUT );  

  EEPROM_size = /*EEPROM.length()*/1024;
  pre_time=millis();
  randomSeed(analogRead(0));

  Serial.begin(115200);
  rbuff_reset();

  setup_bme280();

}


void loop() {  
#ifdef  IOS

#else
  //シリアル通信関連の初期化
  if(!isInitSerial && WebUSBSerial){
    WebUSBSerial.begin(9600);
    //rbuff_reset();
    WebUSBSerial.flush();
    isInitSerial=true;
  }
#endif

#ifdef  IOS
  while(Serial.available()){
    int chr = Serial.read();
    rbuff[r_index] = (char) chr;
    Serial.write(chr);
    r_index++;

    //シリアル通信のコマンド解読
    //改行コマンドを受信したら、蓄積した受信バッファの解読と実行を行う
    if(chr=='\n' || chr=='\r' ||  chr=='\0'){
      Serial.write("\r\n");
      Serial.flush();

      parse_cmd();
      rbuff_reset();
    }
    else if(r_index>=RECV_BUFF_LEN){
      rbuff_reset();
    }
    Serial.flush();
  }

  if(recv_midi()){
    //MIDI通信のコマンド解読処理
    midi_send(String(rbuff)+String("\r\n"));
    parse_cmd();
    rbuff_reset();
  }
#else
  while((isInitSerial && WebUSBSerial.available()) || Serial.available()){
    int chr = 0;
    if(isInitSerial && WebUSBSerial.available()) chr = WebUSBSerial.read();
    else if(Serial.available()) chr = Serial.read();
    rbuff[r_index] = (char) chr;
    r_index++;

    if(isInitSerial) WebUSBSerial.write(chr);
    Serial.write(chr);
    
    //改行コマンドを受信したら、蓄積した受信バッファの解読と実行を行う
    if(chr=='\n' || chr=='\r' ||  chr=='\0'){
      if(isInitSerial){
        WebUSBSerial.write("\r\n");
        WebUSBSerial.flush();
      }
      Serial.write("\r\n");
      Serial.flush();

      parse_cmd();
      rbuff_reset();
    }
    else if(r_index>=RECV_BUFF_LEN){
      rbuff_reset();
    }
    
    if(isInitSerial) WebUSBSerial.flush();
    Serial.flush();
  }
#endif

  //実行コードを1step進める
  step_seq();

  //メモリマップの更新
  analogWrite( LED1_PIN, memmap[LED1_VAL] );
  analogWrite( LED2_PIN, memmap[LED2_VAL] );
  
  memmap[RANDOM]= random(255);
  memmap[TIMER]= counter/1000;
  
  memmap[SW_VAL]= digitalRead( SW_PIN )==0;

  if(isUpdateBuzzer){
    if(memmap[BUZZER_TONE]<=0 || memmap[BUZZER_TONE]>(sizeof(tone_table)/sizeof(int))+1) noTone(BUZZER_PIN);
    else tone(BUZZER_PIN,tone_table[memmap[BUZZER_TONE]-1],memmap[BUZZER_TIME]*16);
    isUpdateBuzzer=false;
  }

  bme280_task();

  memmap[SENSOR1_VAL]= (analogRead( SN1_PIN )>>2) & 0xff;
  memmap[SENSOR2_VAL]= (analogRead( SN2_PIN )>>2) & 0xff;
  memmap[SENSOR3_VAL]= (analogRead( SN3_PIN )>>2) & 0xff;
  memmap[SENSOR4_VAL]= (analogRead( SN4_PIN )>>2) & 0xff;

  if(memmap[SW_VAL]!=0 && memmap[EXEC_MODE]==EXEC_NONE) memmap[EXEC_MODE]=EXEC_START;
}

//実行コードの状態に応じた処理の実行
void step_seq(){
  unsigned long next_time=millis();
  
  switch(memmap[EXEC_MODE]){
    case EXEC_NONE:
    break;
    
    case EXEC_START:
      //メモリマップ類の初期化等
      counter = 0;
      memset(call_adr,0,sizeof(call_adr));
      call_index=0;
      memmap[EXEC_MODE] = EXEC_INEXEC;

    break;
    
    case EXEC_INEXEC:
    {
      int fetch_addr = (memmap[SEQ_COUNT_MSB]<<8) + memmap[SEQ_COUNT_LSB];
      
      fetch_addr = cmd_exec(fetch_addr);

      memmap[SEQ_COUNT_MSB] = (fetch_addr>>8) & 0xff;
      memmap[SEQ_COUNT_LSB] = fetch_addr & 0xff;
    } 
    break;
    
    case EXEC_INWAIT:
      wt -= (next_time-pre_time);
      if(wt<=0){
        memmap[EXEC_MODE] = EXEC_INEXEC;
        wt=0;
      }
    break;
    
    case EXEC_STOP:
      memmap[EXEC_MODE] = EXEC_NONE;
    break;
  }

  counter += next_time-pre_time;
  pre_time = next_time;
  
}

//現在の実行コード参照位置に応じて実際のコマンドを実行
int cmd_exec(int addr){
  int ret_addr=addr;
  //コマンドのフェッチ
  byte cmd = EEPROM.read(ret_addr++);
  byte val_b=0;
  byte sz_b=0;
  int val_w=0;

  switch(cmd){
  default :
  case RC_STOP   :       // 停止
    memmap[EXEC_MODE] = EXEC_STOP;
    break;
    
  case RC_JUMP   :       // ジャンプ
    val_w= (EEPROM.read(ret_addr++)<<8) + EEPROM.read(ret_addr++);
    ret_addr= val_w;
    break;
    
  case RC_CALL   :      // コール
    val_w= (EEPROM.read(ret_addr++)<<8) + EEPROM.read(ret_addr++);
    call_adr[call_index++] = ret_addr;
    ret_addr= val_w;
    break;
    
  case RC_RET    :      // リターン
    ret_addr= call_adr[--call_index];
    break;
    
  case RC_WAIT_W :       // 固定時間待ち
    memmap[EXEC_MODE] = EXEC_INWAIT;
    wt = (EEPROM.read(ret_addr++)<<8) + EEPROM.read(ret_addr++);
    break;
    
  case RC_MEMW_B :      // メモリ書き込み
    val_b = EEPROM.read(ret_addr++);
    sz_b = EEPROM.read(ret_addr++);
    for(int i=val_b;i<val_b+sz_b;i++){
      memmap[i] = EEPROM.read(ret_addr++);
      if(i==BUZZER_TONE || i==BUZZER_TIME ) isUpdateBuzzer=true;
    }
    break;
    
  case RC_C_INIT :      // 計算
    memset(stack,0,sizeof(stack));
    stack_index=0;
    break;
    
  case RC_C_DUP  :      // 計算 値の複製
    stack_index++;
    stack[stack_index] = stack[stack_index-1];
    break;
  case RC_C_C_L  :      // 計算 定数
    stack_index++;
    stack[stack_index] =  EEPROM.read(ret_addr++);
    break;
  case RC_C_MR_B :      // 計算 メモリ読み出し
    val_b = EEPROM.read(ret_addr++);
    stack_index++;
    stack[stack_index] = memmap[val_b];
    break;
  case RC_C_MW_B :      // 計算 メモリ書き込み
    val_b = EEPROM.read(ret_addr++);
    memmap[val_b] = stack[stack_index];
    if(val_b==BUZZER_TONE || val_b==BUZZER_TIME ) isUpdateBuzzer=true;
    break;
  case RC_C_ADD  :      // 計算 加算
    stack_index++;
    stack[stack_index] = stack[stack_index-2] + stack[stack_index-1];
    break;
  case RC_C_SUB  :      // 計算 減算
    stack_index++;
    stack[stack_index] = stack[stack_index-2] - stack[stack_index-1];
    break;
  case RC_C_MUL  :      // 計算 乗算
    stack_index++;
    stack[stack_index] = stack[stack_index-2] * stack[stack_index-1];
    break;
  case RC_C_DIV  :      // 計算 除算
    stack_index++;
    stack[stack_index] = stack[stack_index-2] / stack[stack_index-1];
    break;
  case RC_C_MOD  :      // 計算 余り
    stack_index++;
    stack[stack_index] = stack[stack_index-2] % stack[stack_index-1];
    break;
  case RC_C_AND  :      // 計算 ビットAND
    stack_index++;
    stack[stack_index] = stack[stack_index-2] & stack[stack_index-1];
    break;
  case RC_C_OR   :      // 計算 ビットOR
    stack_index++;
    stack[stack_index] = stack[stack_index-2] | stack[stack_index-1];
    break;
  case RC_C_XOR  :      // 計算 ビットXOR
    stack_index++;
    stack[stack_index] = stack[stack_index-2] ^ stack[stack_index-1];
    break;
  case RC_C_NOT  :      // 計算 ビットNOT
    stack_index++;
    stack[stack_index] = ~ stack[stack_index-1];
    break;
  case RC_C_EQ   :      // 計算 =
    calc_flag = stack[stack_index-1] == stack[stack_index];
    break;
  case RC_C_NE   :      // 計算 !=
    calc_flag = stack[stack_index-1] != stack[stack_index];
    break;
  case RC_C_GT   :      // 計算 >
    calc_flag = stack[stack_index-1] > stack[stack_index];
    break;
  case RC_C_GE   :      // 計算 >=
    calc_flag = stack[stack_index-1] >= stack[stack_index];
    break;
  case RC_C_LT   :      // 計算 <
    calc_flag = stack[stack_index-1] < stack[stack_index];
    break;
  case RC_C_LE   :      // 計算 <=
    calc_flag = stack[stack_index-1] <= stack[stack_index];
    break;
  case RC_C_JUMP :      // 計算 真ならジャンプ
    val_w= (EEPROM.read(ret_addr++)<<8) + EEPROM.read(ret_addr++);
    if(calc_flag) ret_addr=val_w;
    break;
  }
  return ret_addr;
}

//受信したメッセージの解読
void parse_cmd(){
  char cmd;
  int addr,sz;
  char wbuf[256];

  switch(rbuff[0]){
    case 'w':
    case 'W':
      addr = itoh(rbuff[2],rbuff[3]);
      for(int i=5;i<r_index;i+=2){
        if(rbuff[i]=='\n' || rbuff[i]=='\r' ||  rbuff[i]=='\0' || addr>=MEMMAP_SIZE) break;
        memmap[addr] = itoh(rbuff[i],rbuff[i+1]);
        if(addr==BUZZER_TONE || addr==BUZZER_TIME) isUpdateBuzzer=true;
        addr++;
      }
    break;

    case 'r':
    case 'R':
      memset(wbuf,0,sizeof(wbuf));
      addr = itoh(rbuff[2],rbuff[3]);
      sz = itoh(rbuff[5],rbuff[6]);
      for(int i=addr;i<addr+sz;i++){
        if(i>=MEMMAP_SIZE) break;
        strcat(wbuf,htoi(memmap[i]));
        strcat(wbuf," ");
      }
#ifdef  IOS
        midi_send(String(wbuf));
#else
      if(isInitSerial) WebUSBSerial.write(wbuf);
#endif
      Serial.write(wbuf);
    break;

    case 'p':
    case 'P':
      addr = itoh(rbuff[2],rbuff[3]);
      for(int i=5;i<r_index;i+=2){
        if(rbuff[i]=='\n' || rbuff[i]=='\r' ||  rbuff[i]=='\0' || addr>=EEPROM_size) break;
        EEPROM.write(addr,itoh(rbuff[i],rbuff[i+1]));
        addr++;
      }
    break;

    case 'f':
    case 'F':
      EEPROM.put(0,memmap);
#ifdef  IOS
      midi_send(String("flash memmap.\r\n"));
#else
      if(isInitSerial) WebUSBSerial.write("flash memmap.\r\n");
#endif
      Serial.write("flash memmap.\r\n");
    break;

    case 'g':
    case 'G':
      memset(wbuf,0,sizeof(wbuf));
      addr = itoh(rbuff[2],rbuff[3]);
      sz = itoh(rbuff[5],rbuff[6]);
      for(int i=addr;i<addr+sz;i++){
        if(i>=EEPROM_size) break;
        byte r = EEPROM.read(i);
        strcat(wbuf,htoi(r));
        strcat(wbuf," ");
      }
#ifdef  IOS
      midi_send(String(wbuf));
#else
      if(isInitSerial) WebUSBSerial.write(wbuf);
#endif
      Serial.write(wbuf);
    break;
    

    
    default:
#ifdef  IOS
      midi_send(String("error:undefined cmd or fmt.\r\n"));
#else
      if(isInitSerial) WebUSBSerial.write("error:undefined cmd or fmt.\r\n");
#endif
      Serial.write("error:undefined cmd or fmt.\r\n");
    break;
  }
#ifdef  IOS
  MidiUSB.flush();
#else
  if(isInitSerial) WebUSBSerial.flush();
#endif
  Serial.flush();
}

//16進数表記の2byteのテキストを数値に変換
int itoh(char msb,char lsb){
  int ret=0;
  if(msb>='0' && msb<='9') ret = msb-'0';
  else if(msb>='a' && msb<='f') ret = msb-'a'+10;
  else if(msb>='A' && msb<='F') ret = msb-'A'+10;

  ret = ret<<4;
  if(lsb>='0' && lsb<='9') ret += lsb-'0';
  else if(lsb>='a' && lsb<='f') ret += lsb-'a'+10;
  else if(lsb>='A' && lsb<='F') ret += lsb-'A'+10;

  return ret;
}

//数値を16進数表記の2byteのテキストに変換
char *htoi(char h){
  static char ret[3];
  ret[0]='0';
  ret[1]='0';
  ret[2]='\0';
  int lsb=h&0x0f,msb=(h&0xf0)>>4;

  if(lsb>=0 && lsb<=9) ret[1] = '0'+lsb;
  else if(lsb>=10 && lsb<=15) ret[1] = 'a'+lsb-10;
  if(msb>=0 && msb<=9) ret[0] = '0'+msb;
  else if(msb>=10 && msb<=15) ret[0] = 'a'+msb-10;
  
  return ret;
}

//受信バッファのクリア
void rbuff_reset(){
  memset(rbuff,0,sizeof(rbuff));
  r_index=0;
#ifdef  IOS
  midi_send(String(PROMPT));
#else
  if(isInitSerial) WebUSBSerial.write(PROMPT);
#endif
  Serial.write(PROMPT);
}



#ifdef  IOS
//MIDIの通信処理
bool recv_midi()
{
  while(1){
    // read midi data from usb
    midi_out = MidiUSB.read();
  
    // send midi traffic to physical midi port
    if(midi_out.header !=0){
      // output the data 
      if (flgSysExRemain){
        if((midi_out.byte1 != 0xF7) && (midi_out.byte2 != 0xF7) && (midi_out.byte3 != 0xF7)){
          rbuff[r_index++] = midi_out.byte1;
          rbuff[r_index++] = midi_out.byte2;
          rbuff[r_index++] = midi_out.byte3;
        }else if((midi_out.byte1 != 0xF7) && (midi_out.byte2 != 0xF7) && (midi_out.byte3 == 0xF7)){
          rbuff[r_index++] = midi_out.byte1;
          rbuff[r_index++] = midi_out.byte2;
          flgSysExRemain = false;
          return true;
        }else if((midi_out.byte1 != 0xF7) && (midi_out.byte2 == 0xF7)){
          rbuff[r_index++] = midi_out.byte1;
          flgSysExRemain = false;
          return true;
        }else if((midi_out.byte1 == 0xF7)){
          flgSysExRemain = false;
          return true;
        }
      }
      
      // System Common Messages
      else if(midi_out.byte1 == 0xF0) // System Exclusive
      {
        r_index=0;
        memset(rbuff,0,sizeof(rbuff));
        if((midi_out.byte2 != 0xF7)){
          rbuff[r_index++] = midi_out.byte2;
          rbuff[r_index++] = midi_out.byte3;
          flgSysExRemain = true;
        }else{  // This pattern (F0 F7) will not occur, ManufactureID and data should be exist between F0 and F7
          rbuff[r_index++] = midi_out.byte2;
          return true;
        }
      }
    }
    else break;
  }
  return false;  
}

//MIDI通信のメッセージ送信処理
void midi_send(String mes)
{
  int len=mes.length()+mes.length()%2;
  byte data[len];
  memset(data,0,sizeof(data));
  mes.getBytes(data,mes.length()+1);
  
  for(int i=0;i<len;i+=2){
    byte msb=data[i],lsb=0;
    lsb=data[i+1];
    midiEventPacket_t noteOn = {0x09, 0x90, msb&0x7f, lsb&0x7f};
    MidiUSB.sendMIDI(noteOn);
    MidiUSB.flush();
    
  }
  //midiEventPacket_t noteOn = {0x09, 0x90, 0, 0};
  //MidiUSB.sendMIDI(noteOn);
  //MidiUSB.flush();
}
#endif


//BME280(温湿度/気圧センサ)を読み込んでメモリマップに数値を代入する関数
void bme280_task()
{
    double temp_act = 0.0, press_act = 0.0,hum_act=0.0;
    signed long int temp_cal;
    unsigned long int press_cal,hum_cal;
     
    readData();
     
    temp_cal = calibration_T(temp_raw);
    press_cal = calibration_P(pres_raw);
    hum_cal = calibration_H(hum_raw);
    temp_act = (double)temp_cal / 100.0;
    press_act = (double)press_cal / 100.0;
    hum_act = (double)hum_cal / 1024.0;

    memmap[TEMP] = (int) temp_act;
    memmap[HUM] = (int) hum_act;
    
    /*Serial.print("TEMP : ");
    Serial.print(temp_act);
    Serial.print(" DegC  PRESS : ");
    Serial.print(press_act);
    Serial.print(" hPa  HUM : ");
    Serial.print(hum_act);
    Serial.println(" %");    */
}


//BME280(温湿度/気圧センサ)関連の基本関数
void readTrim()
{
    uint8_t data[32],i=0;
    Wire.beginTransmission(BME280_ADDRESS);
    Wire.write(0x88);
    Wire.endTransmission();
    Wire.requestFrom(BME280_ADDRESS,24);
    while(Wire.available()){
        data[i] = Wire.read();
        i++;
    }
     
    Wire.beginTransmission(BME280_ADDRESS);
    Wire.write(0xA1);
    Wire.endTransmission();
    Wire.requestFrom(BME280_ADDRESS,1);
    data[i] = Wire.read();
    i++;
     
    Wire.beginTransmission(BME280_ADDRESS);
    Wire.write(0xE1);
    Wire.endTransmission();
    Wire.requestFrom(BME280_ADDRESS,7);
    while(Wire.available()){
        data[i] = Wire.read();
        i++;    
    }
    dig_T1 = (data[1] << 8) | data[0];
    dig_T2 = (data[3] << 8) | data[2];
    dig_T3 = (data[5] << 8) | data[4];
    dig_P1 = (data[7] << 8) | data[6];
    dig_P2 = (data[9] << 8) | data[8];
    dig_P3 = (data[11]<< 8) | data[10];
    dig_P4 = (data[13]<< 8) | data[12];
    dig_P5 = (data[15]<< 8) | data[14];
    dig_P6 = (data[17]<< 8) | data[16];
    dig_P7 = (data[19]<< 8) | data[18];
    dig_P8 = (data[21]<< 8) | data[20];
    dig_P9 = (data[23]<< 8) | data[22];
    dig_H1 = data[24];
    dig_H2 = (data[26]<< 8) | data[25];
    dig_H3 = data[27];
    dig_H4 = (data[28]<< 4) | (0x0F & data[29]);
    dig_H5 = (data[30] << 4) | ((data[29] >> 4) & 0x0F);
    dig_H6 = data[31];   
}
void writeReg(uint8_t reg_address, uint8_t data)
{
    Wire.beginTransmission(BME280_ADDRESS);
    Wire.write(reg_address);
    Wire.write(data);
    Wire.endTransmission();    
}
 
 
void readData()
{
    int i = 0;
    uint32_t data[8];
    Wire.beginTransmission(BME280_ADDRESS);
    Wire.write(0xF7);
    Wire.endTransmission();
    Wire.requestFrom(BME280_ADDRESS,8);
    while(Wire.available()){
        data[i] = Wire.read();
        i++;
    }
    pres_raw = (data[0] << 12) | (data[1] << 4) | (data[2] >> 4);
    temp_raw = (data[3] << 12) | (data[4] << 4) | (data[5] >> 4);
    hum_raw  = (data[6] << 8) | data[7];
}
 
 
signed long int calibration_T(signed long int adc_T)
{
     
    signed long int var1, var2, T;
    var1 = ((((adc_T >> 3) - ((signed long int)dig_T1<<1))) * ((signed long int)dig_T2)) >> 11;
    var2 = (((((adc_T >> 4) - ((signed long int)dig_T1)) * ((adc_T>>4) - ((signed long int)dig_T1))) >> 12) * ((signed long int)dig_T3)) >> 14;
     
    t_fine = var1 + var2;
    T = (t_fine * 5 + 128) >> 8;
    return T; 
}
 
unsigned long int calibration_P(signed long int adc_P)
{
    signed long int var1, var2;
    unsigned long int P;
    var1 = (((signed long int)t_fine)>>1) - (signed long int)64000;
    var2 = (((var1>>2) * (var1>>2)) >> 11) * ((signed long int)dig_P6);
    var2 = var2 + ((var1*((signed long int)dig_P5))<<1);
    var2 = (var2>>2)+(((signed long int)dig_P4)<<16);
    var1 = (((dig_P3 * (((var1>>2)*(var1>>2)) >> 13)) >>3) + ((((signed long int)dig_P2) * var1)>>1))>>18;
    var1 = ((((32768+var1))*((signed long int)dig_P1))>>15);
    if (var1 == 0)
    {
        return 0;
    }    
    P = (((unsigned long int)(((signed long int)1048576)-adc_P)-(var2>>12)))*3125;
    if(P<0x80000000)
    {
       P = (P << 1) / ((unsigned long int) var1);   
    }
    else
    {
        P = (P / (unsigned long int)var1) * 2;    
    }
    var1 = (((signed long int)dig_P9) * ((signed long int)(((P>>3) * (P>>3))>>13)))>>12;
    var2 = (((signed long int)(P>>2)) * ((signed long int)dig_P8))>>13;
    P = (unsigned long int)((signed long int)P + ((var1 + var2 + dig_P7) >> 4));
    return P;
}
 
unsigned long int calibration_H(signed long int adc_H)
{
    signed long int v_x1;
     
    v_x1 = (t_fine - ((signed long int)76800));
    v_x1 = (((((adc_H << 14) -(((signed long int)dig_H4) << 20) - (((signed long int)dig_H5) * v_x1)) + 
              ((signed long int)16384)) >> 15) * (((((((v_x1 * ((signed long int)dig_H6)) >> 10) * 
              (((v_x1 * ((signed long int)dig_H3)) >> 11) + ((signed long int) 32768))) >> 10) + (( signed long int)2097152)) * 
              ((signed long int) dig_H2) + 8192) >> 14));
   v_x1 = (v_x1 - (((((v_x1 >> 15) * (v_x1 >> 15)) >> 7) * ((signed long int)dig_H1)) >> 4));
   v_x1 = (v_x1 < 0 ? 0 : v_x1);
   v_x1 = (v_x1 > 419430400 ? 419430400 : v_x1);
   return (unsigned long int)(v_x1 >> 12);   
}
