BLOCKSETTING={};




function itohex(num){
    if(isFinite(num)){
        if(num<0){
            var d = Math.floor(num) >>> 0; // 負数を2の補数で表現
            return `0${d.toString(16)}`.slice( -2 ); // "ffffffd3"
        }
        else return `0${Math.floor(num).toString(16)}`.slice( -2 );
    } 
    return "00";
}


Blockly.makecode_commonfunc = function(block){
    if(!(block.id in BLOCKAREA.addressmap)){
        block.topID = BLOCKAREA.address;
        BLOCKAREA.addressmap[block.id]={topID:block.topID};
    }
}

Blockly.makecode_bottom = function(block){
    if((block.id in BLOCKAREA.addressmap)){
        BLOCKAREA.addressmap[block.id].bottomID=block.bottomID;
    }
}


Blockly.Blocks['start'] = {
    init: function() {
        this.jsonInit({
            "message0": 'はじめ',
            "nextStatement": null,
            "colour": 20 /*"#ff0000"*/,
            "tooltip": "ここからプログラムがはじまります。\n※このブロックはコピー・削除できません。",
            
        });
        this.setDeletable(false);
    },

    unDeletable:true,

    topID:-1,
    bottomID:-1,
    

    makecode:function(){
        Blockly.makecode_commonfunc(this);

        /*BLOCKAREA.code += `${itohex(CODE_MAP.RC_MEMW_B)}`;
        BLOCKAREA.code += `${itohex(MEMMAP_TBL.MOT1_SPD)}`;
        BLOCKAREA.code += `04`;
        BLOCKAREA.code += `00000000`;
        
        BLOCKAREA.address += 7;*/

        this.bottomID = BLOCKAREA.address;
        Blockly.makecode_bottom(this);
    }

};




Blockly.Blocks['end'] = {
    init: function() {
        this.jsonInit({
            "message0": 'おわり',
            "previousStatement": null,
            "colour": 20,
            "tooltip": "プログラムをおわらせます。",
        });
    },

    topID:-1,
    bottomID:-1,


    makecode:function(){
        Blockly.makecode_commonfunc(this);

        BLOCKAREA.code += BLOCKAREA.getEndCode();
        BLOCKAREA.address += BLOCKAREA.getEndCodeLength();
    
        this.bottomID = BLOCKAREA.address;
        Blockly.makecode_bottom(this);
    }

    
};




Blockly.Blocks['wait_base'] = {
    init: function() {
        this.jsonInit({
            "message0": 'つづける %1',
            "previousStatement": null,
            "nextStatement": null,
            "tooltip": "今のじょうたいを、その時間だけつづけてから、次のブロックへすすみます。",
            "args0": [
                {
                "type": "input_value",
                "name": "VALUE",
                "check": "Number"
                }
            ],
            "colour": 290,
        });
    },
    
    topID:-1,
    bottomID:-1,

    makecode:function(){
        Blockly.makecode_commonfunc(this);

        var inputBlk = this.getInputTargetBlock('VALUE');
        var waittime=inputBlk.getFieldValue('FIELDNAME') || 0;
        waittime*=1000;
        
        BLOCKAREA.code += `${itohex(CODE_MAP.RC_WAIT_W)}`;
        BLOCKAREA.code += `${itohex(waittime/256)}${itohex(waittime%256)}`;
        BLOCKAREA.address += 3;

        this.bottomID = BLOCKAREA.address;
        Blockly.makecode_bottom(this);
    }

};
/*
Blockly.Blocks['move_base'] = {
    init: function() {
        this.jsonInit({
            "message0": 'モータ%1 %2',
            "previousStatement": null,
            "nextStatement": null,
            "tooltip": "モータを使ってロボットを走らせたり止めたりします。\n時間をくっつけると、その時間だけ走って止まります。\n時間をくっつけないと、走りっぱなしになります。",
            "args0": [
                {
                    "type": "field_dropdown",
                    "name": "FIELDNAME",
                    "options": [
                        [ "止まる", "STOP" ],
                        [ "まえ", "FWD" ],
                        [ "右まえ", "RFWD" ],
                        [ "左まえ", "LFWD" ],
                        [ "右まわり", "RTURN" ],
                        [ "左まわり", "LTURN" ],
                        [ "うしろ", "BACK" ],
                        [ "右うしろ", "RBACK" ],
                        [ "左うしろ", "LBACK" ],
                    ]
                },
                {
                "type": "input_value",
                "name": "VALUE",
                "check": "Number"
                }
            ],
            "colour": 210,
        });
    },
    
    topID:-1,
    bottomID:-1,

    makecode:function(){
        Blockly.makecode_commonfunc(this);

        BLOCKAREA.code += `${itohex(CODE_MAP.RC_MEMW_B)}${itohex(MEMMAP_TBL.MOT1_SPD)}02`;

        var lspd=0,rspd=0;
        //正転->時計回り
        switch(this.getFieldValue('FIELDNAME')){
            case 'FWD':
                lspd=-ROBOT.defaultSpd;
                rspd=ROBOT.defaultSpd;
            break;
            
            case 'BACK':
                lspd=ROBOT.defaultSpd;
                rspd=-ROBOT.defaultSpd;
            break;

            case 'RFWD' :
                lspd=-ROBOT.defaultSpd;
            break;
            case 'LFWD' :
                rspd=ROBOT.defaultSpd;
            break;
            case 'RTURN' :
                lspd=-ROBOT.defaultSpd;
                rspd=-ROBOT.defaultSpd;
            break;
            case 'LTURN' :
                lspd=ROBOT.defaultSpd;
                rspd=ROBOT.defaultSpd;
            break;
            case 'RBACK' :
                lspd=ROBOT.defaultSpd;
            break;
            case 'LBACK' :
                rspd=-ROBOT.defaultSpd;
            break;

            case 'STOP' :
            break;
        }

        BLOCKAREA.code += `${itohex(lspd)}${itohex(rspd)}`;

        BLOCKAREA.address += 5;

        //時間指定があるか
        var inputBlk = this.getInputTargetBlock('VALUE');
        if(inputBlk){
            //指定時間待ち
            var waittime=inputBlk.getFieldValue('FIELDNAME') || 0;
            waittime*=1000;
            BLOCKAREA.code += `${itohex(CODE_MAP.RC_WAIT_W)}`;
            BLOCKAREA.code += `${itohex(waittime/256)}${itohex(waittime%256)}`;
    
            BLOCKAREA.address += 3;

            //時間待ち後モータを止める
            BLOCKAREA.code += `${itohex(CODE_MAP.RC_MEMW_B)}${itohex(MEMMAP_TBL.MOT1_SPD)}020000`;
            BLOCKAREA.address += 5;
        }

        this.bottomID = BLOCKAREA.address;
        Blockly.makecode_bottom(this);
    }

};
*/


BLOCKSETTING.LEDCOLOR_RED='#ff0000';
BLOCKSETTING.LEDCOLOR_GREEN='#00ff00';

Blockly.FieldColour.COLOURS = [BLOCKSETTING.LEDCOLOR_RED,BLOCKSETTING.LEDCOLOR_GREEN];
Blockly.FieldColour.COLUMNS = 2;

Blockly.Blocks['led_base'] ={

    init: function() {
        this.jsonInit({
            "message0": 'ライト%1 %2 %3',
            "previousStatement": null,
            "nextStatement": null,
            "tooltip": "赤と緑のライトをつけたりけしたりします。\n時間をくっつけると、その時間だけライトがつきます。\n時間をくっつけないと、つけっぱなしになります",
            "args0": [
                    {
                    "type": "field_colour",
                    "name": "LEDCOLOR",
                    "colour": Blockly.FieldColour.COLOURS[0]
                    },
                    {
                    "type": "field_dropdown",
                    "name": "FIELDNAME",
                    "options": [
                        [ "つける", "1" ],
                        [ "けす", "0" ]
                    ]
                },
                {
                "type": "input_value",
                "name": "VALUE",
                "check": "Number"
                }
            ],
            "colour": 60,
        });
    },
    
    topID:-1,
    bottomID:-1,

    makecode:function(){
        Blockly.makecode_commonfunc(this);

        var addr = MEMMAP_TBL.LED1_VAL +Blockly.FieldColour.COLOURS.indexOf(this.getFieldValue('LEDCOLOR'));

        var param = this.getFieldValue('FIELDNAME')*255;
        BLOCKAREA.code += `${itohex(CODE_MAP.RC_MEMW_B)}${itohex(addr)}01${itohex(param)}`;

        BLOCKAREA.address += 4;

        //時間指定があるか
        var inputBlk = this.getInputTargetBlock('VALUE');
        if(inputBlk){
            //指定時間待ち
            var waittime=inputBlk.getFieldValue('FIELDNAME') || 0;
            waittime*=1000;
            BLOCKAREA.code += `${itohex(CODE_MAP.RC_WAIT_W)}`;
            BLOCKAREA.code += `${itohex(waittime/256)}${itohex(waittime%256)}`;
    
            BLOCKAREA.address += 3;

            //時間待ち後LEDを消す
            BLOCKAREA.code += `${itohex(CODE_MAP.RC_MEMW_B)}${itohex(addr)}0100`;
            BLOCKAREA.address += 4;
        }
        this.bottomID = BLOCKAREA.address;
        Blockly.makecode_bottom(this);
    }

};

const BUZZ_TIME_BASE_DIV=6;
Blockly.Blocks['buzzer_base'] ={

    init: function() {
        this.jsonInit({
            "message0": 'ブザー%1 %2 長さ%3 %4',
            "previousStatement": null,
            "nextStatement": null,
            "tooltip": "ブザーを鳴らします。\nたかさ、ながさ、鳴り終えるまで待つかをそれぞれえらびます",
            "args0": [
                    {
                        "type": "field_dropdown",
                        "name": "BUZ_OCTAVE",
                        "options": [
                            [ "やすみ", "0" ],
                            [ "ひくい", "1" ],
                            [ "ふつう", "2" ],
                            [ "たかい", "3" ]
                        ]
                    },
                    {
                    "type": "field_dropdown",
                    "name": "BUZ_TONE",
                    "options": [
                        [ "ド",   "1" ],
                        [ "ド#",  "2" ],
                        [ "レ",   "3" ],
                        [ "レ#",  "4" ],
                        [ "ミ",   "5" ],
                        [ "ファ", "6" ],
                        [ "ファ#","7" ],
                        [ "ソ",   "8" ],
                        [ "ソ#",  "9" ],
                        [ "ラ",   "10" ],
                        [ "ラ#",  "11" ],
                        [ "シ",   "12" ]
                    ]
                    },
                    {
                        "type": "field_dropdown",
                        "name": "BUZ_TIME",
                        "options": [
                            [ "1",      `${BUZZ_TIME_BASE_DIV*32}` ],
                            [ "2.5",    `${BUZZ_TIME_BASE_DIV*24}` ],
                            [ "2",      `${BUZZ_TIME_BASE_DIV*16}` ],
                            [ "4.5",    `${BUZZ_TIME_BASE_DIV*12}` ],
                            [ "4",      `${BUZZ_TIME_BASE_DIV*8}` ],
                            [ "8.5",    `${BUZZ_TIME_BASE_DIV*6}` ],
                            [ "8",      `${BUZZ_TIME_BASE_DIV*4}` ],
                            [ "16",     `${BUZZ_TIME_BASE_DIV*2}` ],
                            [ "32",     `${BUZZ_TIME_BASE_DIV}` ]
                        ]
                    },
                    {
                        "type": "field_dropdown",
                        "name": "BUZ_NEXT",
                        "options": [
                            [ "待つ", "1" ],
                            [ "待たない", "0" ]
                        ]
                    }
    
            ],
            "colour": 210,
        });
    },
    
    topID:-1,
    bottomID:-1,

    makecode:function(){
        Blockly.makecode_commonfunc(this);


        var tone = Number(this.getFieldValue('BUZ_OCTAVE'));
        var time = this.getFieldValue('BUZ_TIME');

        if(tone!=0) tone = Number(this.getFieldValue('BUZ_TONE')) + ((tone-1)*12);
        BLOCKAREA.code += `${itohex(CODE_MAP.RC_MEMW_B)}${itohex(MEMMAP_TBL.BUZZER_TONE)}02${itohex(tone)}${itohex(time)}`;

        BLOCKAREA.address += 5;

        if(this.getFieldValue('BUZ_NEXT')=="1"){
            var waittime = time*16;

            BLOCKAREA.code += `${itohex(CODE_MAP.RC_WAIT_W)}`;
            BLOCKAREA.code += `${itohex(waittime/256)}${itohex(waittime%256)}`;
            BLOCKAREA.address += 3;

        }

        this.bottomID = BLOCKAREA.address;
        Blockly.makecode_bottom(this);
    }

};


Blockly.Blocks['do_sec'] = {
    init: function() {
        this.jsonInit(
            {
                "type": "time_seccond",
                "message0": "%1びょう",
                "tooltip": "モータやブザーなどにくっつけると、それをつかう時間を決められます。",
                "output": "Number",
                "colour": 230,
                "args0": [
                    {
                    "type": "field_number",
                    "name": "FIELDNAME",
                    "value": 2.00
                    }
                ]
            }                    
        
        );
    },
    
    topID:-1,
    bottomID:-1,

};



Blockly.Blocks['variable'] = {
    init: function() {
        this.jsonInit(
            {
                "type": "variable",
                "message0": "%1",
                "tooltip": "変数",
                "output": "Number",
                "colour": 36,
                "args0": [
                    {
                        "type": "field_dropdown",
                        "name": "FIELDNAME",
                        "options": ROBOT.getmemmapfielddropdown()
                    }
                ]
            }                    
        
        );
    },
        
    topID:-1,
    bottomID:-1,

};



Blockly.Blocks['constant'] = {
    init: function() {
        this.jsonInit(
            {
                "type": "constant",
                "message0": "%1",
                "tooltip": "定数",
                "output": "Number",
                "colour": 36,
                "args0": [
                    {
                        "type": "field_number",
                        "name": "FIELDNAME",
                        "min":-128,
                        "max": 255,
                        "value": 0,
                        "precision": 1,
                        "width" : 100,
                    }
                ]
            }                    
        
        );
    },
    
    topID:-1,
    bottomID:-1,


};




Blockly.Blocks['loop_base'] = {
    init: function() {
        this.jsonInit({                   
            "message0": 'くり返し %1 回',
            "previousStatement": null,
            "nextStatement": null,
            "tooltip": "あいだにはさんだブロックを、すきな回数だけくり返します。",
            "args0": [
                    {
                    "type": "field_number",
                    "name": "FIELDNAME",
                    "value": 3
                    }
            ],
            "message1": "内容 %1",
            "args1": [
                {"type": "input_statement", "name": "DO"}
            ],
            "previousStatement": null,
            "nextStatement": null,
            "colour": 350
            });
    },
        
    topID:-1,
    bottomID:-1,

    makecode:function(){
        var childs=[];
        Blockly.makecode_commonfunc(this);
        var loopnum = this.getFieldValue('FIELDNAME');
        var loopvar = BLOCKAREA.loopnest + MEMMAP_TBL.LOOP1;
        BLOCKAREA.loopnest++;

        //ループ変数の初期化
        BLOCKAREA.code += `${itohex(CODE_MAP.RC_MEMW_B)}${itohex(loopvar)}01${itohex(loopnum)}`;
        BLOCKAREA.address += 4;

        //終了判定とジャンプの追加
        BLOCKAREA.code += `${itohex(CODE_MAP.RC_C_INIT)}`;
        BLOCKAREA.code += `${itohex(CODE_MAP.RC_C_MR_B)}${itohex(loopvar)}`;
        BLOCKAREA.code += `${itohex(CODE_MAP.RC_C_EQ)}`;
        BLOCKAREA.code += `${itohex(CODE_MAP.RC_C_JUMP)}${itohex(this.bottomID/256)}${itohex(this.bottomID%256)}`;
        BLOCKAREA.address += 7;

        //カウンター処理の実装
        BLOCKAREA.code += `${itohex(CODE_MAP.RC_C_INIT)}`;
        BLOCKAREA.code += `${itohex(CODE_MAP.RC_C_MR_B)}${itohex(loopvar)}`;
        BLOCKAREA.code += `${itohex(CODE_MAP.RC_C_C_L)}01`;
        BLOCKAREA.code += `${itohex(CODE_MAP.RC_C_SUB)}`;
        BLOCKAREA.code += `${itohex(CODE_MAP.RC_C_MW_B)}${itohex(loopvar)}`;
        BLOCKAREA.address += 8;


        var doBlk=this.getInput('DO').connection.targetBlock();            
        if(doBlk!=null) childs.push(doBlk);
        else this.makecode_bottom();
        return childs;
    },

    makecode_bottom:function(){
        var loopPoint = this.topID;

        //最初の初期化を除く
        loopPoint += 4;
        BLOCKAREA.code += `${itohex(CODE_MAP.RC_JUMP)}${itohex(loopPoint/256)}${itohex(loopPoint%256)}`;
        BLOCKAREA.address += 3;
        this.bottomID = BLOCKAREA.address;
        Blockly.makecode_bottom(this);
        BLOCKAREA.loopnest--;
    }

};

Blockly.Blocks['endlessloop_base'] = {
    init: function() {
        this.jsonInit({
            "message0": 'ずっとくり返し',
            "previousStatement": null,
            "nextStatement": null,
            "message1": "内容 %1",
            "tooltip": "あいだにはさんだブロックを、ずっとくり返します。",
            "args1": [
                {"type": "input_statement", "name": "DO"}
            ],
            "previousStatement": null,
            "nextStatement": null,
            "colour": 350
            });
    },
        
    topID:-1,
    bottomID:-1,

    makecode:function(){
        var childs=[];
        Blockly.makecode_commonfunc(this);

        var doBlk=this.getInput('DO').connection.targetBlock();            
        if(doBlk!=null) childs.push(doBlk);
        else this.makecode_bottom();
        return childs;
    },

    makecode_bottom:function(){
        BLOCKAREA.code += `${itohex(CODE_MAP.RC_JUMP)}${itohex(this.topID/256)}${itohex(this.topID%256)}`;
        BLOCKAREA.address += 3;
        this.bottomID = BLOCKAREA.address;
        Blockly.makecode_bottom(this);
    }

};

Blockly.Blocks['if_base'] = {
    init: function() {
        this.jsonInit({
            "message0": '%1 は %2 より %3 ですか？',
            "previousStatement": null,
            "nextStatement": null,
            "tooltip": "センサが数字よりも、大きいときや小さいときだけに、あいだにはさんだブロックを実行します。",
            "args0": [
                {
                    "type": "field_dropdown",
                    "name": "CMP",
                    "options": [
                        [ "時間", `TIMER`],
                        [ "気温", `TEMP` ],
                        [ "湿度", `HUM` ],
                        [ "センサ1", `SENSOR1_VAL` ],
                        [ "センサ2", `SENSOR2_VAL` ],
                        [ "センサ3", `SENSOR3_VAL` ],
                        [ "センサ4", `SENSOR4_VAL` ]
                    ]
                },
                {
                    "type": "field_number",
                    "name": "IMMIDIATE",
                    "value": 28
                },
                {
                    "type": "field_dropdown",
                    "name": "OPERATOR",
                    "options": [
                        [ "小さい", `RC_C_LT` ],
                        [ "大きい", `RC_C_GT` ]
                    ]
                }
            ],
            "message1": "はい %1",
            "args1": [
                {"type": "input_statement", "name": "DO"}
            ],
            "previousStatement": null,
            "nextStatement": null,
            "colour": 120
            });
    },
    
    topID:-1,
    bottomID:-1,

    makecode:function(){
        var childs=[];
        Blockly.makecode_commonfunc(this);

        var doBlk=this.getInput('DO').connection.targetBlock();            

        //条件判定
        var cmp = ROBOT.getaddrfromname(this.getFieldValue('CMP'));
        var op = CODE_MAP[this.getFieldValue('OPERATOR')];
        
        BLOCKAREA.code += `${itohex(CODE_MAP.RC_C_INIT)}`;
        BLOCKAREA.code += `${itohex(CODE_MAP.RC_C_MR_B)}${itohex(cmp)}`;      //オペランド1の変数または定数をスタックする
        BLOCKAREA.code += `${itohex(CODE_MAP.RC_C_C_L)}${itohex(this.getFieldValue('IMMIDIATE'))}`;      //オペランド2の変数または定数をスタックする
        BLOCKAREA.code += `${itohex(op)}`;         //比較方法を実行
        BLOCKAREA.address += 6;

        //条件が成立していたらchildまでジャンプ
        var yesaddr = doBlk && BLOCKAREA.addressmap[doBlk.id]? BLOCKAREA.addressmap[doBlk.id].topID : this.bottomID;
        BLOCKAREA.code += `${itohex(CODE_MAP.RC_C_JUMP)}${itohex(yesaddr/256)}${itohex(yesaddr%256)}`;  
        BLOCKAREA.address += 3;

        //条件が成立していなかったらbottomまでジャンプ
        BLOCKAREA.code += `${itohex(CODE_MAP.RC_JUMP)}${itohex(this.bottomID/256)}${itohex(this.bottomID%256)}`;  
        BLOCKAREA.address += 3;

        if(doBlk!=null) childs.push(doBlk);
        else this.makecode_bottom();
        return childs;
    },

    makecode_bottom:function(){
        this.bottomID = BLOCKAREA.address;
        Blockly.makecode_bottom(this);
    }


};


Blockly.Blocks['ifelse_base'] = {
    init: function() {
        this.jsonInit({
            "message0": '%1 は %2 より %3 ですか？',
            "previousStatement": null,
            "nextStatement": null,
            "tooltip": "センサが数字よりも、大きいときや小さいときだけに、「はい」にはさんだブロックを実行します。\nそうでなければ「いいえ」にはさんだブロックを実行します。",

            "args0": [
                {
                    "type": "field_dropdown",
                    "name": "CMP",
                    "options": [
                        [ "時間", `TIMER`],
                        [ "気温", `TEMP` ],
                        [ "湿度", `HUM` ],
                        [ "センサ1", `SENSOR1_VAL` ],
                        [ "センサ2", `SENSOR2_VAL` ],
                        [ "センサ3", `SENSOR3_VAL` ],
                        [ "センサ4", `SENSOR4_VAL` ]
                    ]
                },
                {
                    "type": "field_number",
                    "name": "IMMIDIATE",
                    "value": 28
                },
                {
                    "type": "field_dropdown",
                    "name": "OPERATOR",
                    "options": [
                        [ "小さい", `RC_C_LT` ],
                        [ "大きい", `RC_C_GT` ]
                    ]
                }
            ],
            "message1": "はい %1",
            "args1": [
                {"type": "input_statement", "name": "DO"}
            ],
            "message2": "いいえ %1",
            "args2": [
                {"type": "input_statement", "name": "ELSE"}
            ],

            "previousStatement": null,
            "nextStatement": null,
            "colour": 120
            });
    },
    
    topID:-1,
    bottomID:-1,

    makecode:function(){
        var childs=[];
        Blockly.makecode_commonfunc(this);

        var doBlk=this.getInput('DO').connection.targetBlock();            
        var elseBlk=this.getInput('ELSE').connection.targetBlock();            

        //条件判定
        var cmp = ROBOT.getaddrfromname(this.getFieldValue('CMP'));
        var op = CODE_MAP[this.getFieldValue('OPERATOR')];

        BLOCKAREA.code += `${itohex(CODE_MAP.RC_C_INIT)}`;
        BLOCKAREA.code += `${itohex(CODE_MAP.RC_C_MR_B)}${itohex(cmp)}`;      //オペランド1の変数または定数をスタックする
        BLOCKAREA.code += `${itohex(CODE_MAP.RC_C_C_L)}${itohex(this.getFieldValue('IMMIDIATE'))}`;      //オペランド2の変数または定数をスタックする
        BLOCKAREA.code += `${itohex(op)}`;         //比較方法を実行
        BLOCKAREA.address += 6;

        //条件が成立していたらchildまでジャンプ
        var yesaddr = doBlk && BLOCKAREA.addressmap[doBlk.id]? BLOCKAREA.addressmap[doBlk.id].topID : this.bottomID;
        BLOCKAREA.code += `${itohex(CODE_MAP.RC_C_JUMP)}${itohex(yesaddr/256)}${itohex(yesaddr%256)}`;  
        BLOCKAREA.address += 3;

        //条件が成立していなかったらelseまでジャンプ
        var elseaddr = elseBlk && BLOCKAREA.addressmap[elseBlk.id]? BLOCKAREA.addressmap[elseBlk.id].topID : this.bottomID;
        BLOCKAREA.code += `${itohex(CODE_MAP.RC_C_JUMP)}${itohex(elseaddr/256)}${itohex(elseaddr%256)}`;  
        BLOCKAREA.address += 3;

        if(doBlk!=null) childs.push(doBlk);
        if(elseBlk!=null) childs.push(elseBlk);
        if(doBlk==null && elseBlk==null) this.makecode_bottom();
        return childs;
    },

    makecode_bottom:function(loop){
        if(loop==0){
            BLOCKAREA.code += `${itohex(CODE_MAP.RC_JUMP)}${itohex(this.bottomID/256)}${itohex(this.bottomID%256)}`;  
            BLOCKAREA.address += 3;
        }
        else this.bottomID = BLOCKAREA.address;
        Blockly.makecode_bottom(this);
    }

};


Blockly.Blocks['random_base'] = {
    init: function() {
        this.jsonInit({
            "message0": 'ランダム',
            "previousStatement": null,
            "nextStatement": null,
            "tooltip": "ロボットが、「はい」と「いいえ」のどちらかをかってにえらんで、はさんだブロックを実行します。",

            "message1": "はい %1",
            "args1": [
                {"type": "input_statement", "name": "DO"}
            ],
            "message2": "いいえ %1",
            "args2": [
                {"type": "input_statement", "name": "ELSE"}
            ],

            "previousStatement": null,
            "nextStatement": null,
            "colour": 120
            });
    },
    
    isConditionTrue : function(){ return (Math.random()>=0.5);},

    topID:-1,
    bottomID:-1,

    makecode:function(){
        var childs=[];
        Blockly.makecode_commonfunc(this);

        var doBlk=this.getInput('DO').connection.targetBlock();            
        var elseBlk=this.getInput('ELSE').connection.targetBlock();            

        //条件判定
        //2で割った剰余が0かどうかで2分岐する
        BLOCKAREA.code += `${itohex(CODE_MAP.RC_C_INIT)}`;
        BLOCKAREA.code += `${itohex(CODE_MAP.RC_C_MR_B)}${itohex(MEMMAP_TBL.RANDOM)}`; 
        BLOCKAREA.code += `${itohex(CODE_MAP.RC_C_C_L)}02`; 
        BLOCKAREA.code += `${itohex(CODE_MAP.RC_C_MOD)}`; 
        BLOCKAREA.code += `${itohex(CODE_MAP.RC_C_C_L)}00`; 
        BLOCKAREA.code += `${itohex(CODE_MAP.RC_C_EQ)}`;
        BLOCKAREA.address += 9;

        //条件が成立していたらchildまでジャンプ
        var yesaddr = doBlk && BLOCKAREA.addressmap[doBlk.id]? BLOCKAREA.addressmap[doBlk.id].topID : this.bottomID;
        BLOCKAREA.code += `${itohex(CODE_MAP.RC_C_JUMP)}${itohex(yesaddr/256)}${itohex(yesaddr%256)}`;  
        BLOCKAREA.address += 3;

        //条件が成立していなかったらelseまでジャンプ
        var elseaddr = elseBlk && BLOCKAREA.addressmap[elseBlk.id]? BLOCKAREA.addressmap[elseBlk.id].topID : this.bottomID;
        BLOCKAREA.code += `${itohex(CODE_MAP.RC_C_JUMP)}${itohex(elseaddr/256)}${itohex(elseaddr%256)}`;  
        BLOCKAREA.address += 3;

        if(doBlk!=null) childs.push(doBlk);
        if(elseBlk!=null) childs.push(elseBlk);
        if(doBlk==null && elseBlk==null) this.makecode_bottom();
        return childs;
    },

    makecode_bottom:function(loop){
        if(loop==0){
            BLOCKAREA.code += `${itohex(CODE_MAP.RC_JUMP)}${itohex(this.bottomID/256)}${itohex(this.bottomID%256)}`;  
            BLOCKAREA.address += 3;
        }
        else this.bottomID = BLOCKAREA.address;
        Blockly.makecode_bottom(this);
    }

};



//--------------------------------------------------------------------------------
Blockly.Blocks['pro_if_base'] = {
    init: function() {
        this.jsonInit({
            "message0": 'if (%1 %2 %3)?',
            "previousStatement": null,
            "nextStatement": null,
            "tooltip": "if",

            "args0": [
                {"type": "input_value", "name": "OPERAND 1", "check": "Number"},
                {"type": "field_dropdown", "name": "OPECODE", "options": [
                    [ "==", `RC_C_EQ` ],
                    [ "!=", `RC_C_NE` ],
                    [ ">", `RC_C_GT` ],
                    [ ">=", `RC_C_GE` ],
                    [ "<", `RC_C_LT` ],
                    [ "<=", `RC_C_LE` ]
                ]},
                {"type": "input_value", "name": "OPERAND 2", "check": "Number"}
            ],
            "message1": "はい %1",
            "args1": [
                {"type": "input_statement", "name": "DO"}
            ],
            "previousStatement": null,
            "nextStatement": null,
            "colour": 120
            });
    },
    
    topID:-1,
    bottomID:-1,

    makecode:function(){
        var childs=[];
        Blockly.makecode_commonfunc(this);

        var doBlk=this.getInput('DO').connection.targetBlock();            

        //条件判定
        var cmp1blk = this.getInputTargetBlock('OPERAND 1');
        var cmp2blk = this.getInputTargetBlock('OPERAND 2');
        var op = CODE_MAP[this.getFieldValue('OPECODE')];
        
        BLOCKAREA.code += `${itohex(CODE_MAP.RC_C_INIT)}`;
        BLOCKAREA.code += `${itohex(CODE_MAP.RC_C_MR_B)}${itohex(cmp1blk.getFieldValue('FIELDNAME'))}`;      //オペランド1の変数または定数をスタックする
        if(cmp2blk.type=='constant') BLOCKAREA.code += `${itohex(CODE_MAP.RC_C_C_L)}${itohex(cmp2blk.getFieldValue('FIELDNAME'))}`;      //オペランド2の変数または定数をスタックする
        else BLOCKAREA.code += `${itohex(CODE_MAP.RC_C_MR_B)}${itohex(cmp2blk.getFieldValue('FIELDNAME'))}`;
        BLOCKAREA.code += `${itohex(op)}`;         //比較方法を実行
        BLOCKAREA.address += 6;

        //条件が成立していたらchildまでジャンプ
        var yesaddr = doBlk && BLOCKAREA.addressmap[doBlk.id]? BLOCKAREA.addressmap[doBlk.id].topID : this.bottomID;
        BLOCKAREA.code += `${itohex(CODE_MAP.RC_C_JUMP)}${itohex(yesaddr/256)}${itohex(yesaddr%256)}`;  
        BLOCKAREA.address += 3;

        //条件が成立していなかったらbottomまでジャンプ
        BLOCKAREA.code += `${itohex(CODE_MAP.RC_JUMP)}${itohex(this.bottomID/256)}${itohex(this.bottomID%256)}`;  
        BLOCKAREA.address += 3;

        if(doBlk!=null) childs.push(doBlk);
        else this.makecode_bottom();
        return childs;
    },

    makecode_bottom:function(){
        this.bottomID = BLOCKAREA.address;
        Blockly.makecode_bottom(this);
    }


};

Blockly.Blocks['pro_ifelse_base'] = {
    init: function() {
        this.jsonInit({
            "message0": 'if (%1 %2 %3)?',
            "previousStatement": null,
            "nextStatement": null,
            "tooltip": "if else",

            "args0": [
                {"type": "input_value", "name": "OPERAND 1", "check": "Number"},
                {"type": "field_dropdown", "name": "OPECODE", "options": [
                    [ "==", `RC_C_EQ` ],
                    [ "!=", `RC_C_NE` ],
                    [ ">", `RC_C_GT` ],
                    [ ">=", `RC_C_GE` ],
                    [ "<", `RC_C_LT` ],
                    [ "<=", `RC_C_LE` ]
                ]},
                {"type": "input_value", "name": "OPERAND 2", "check": "Number"}
            ],

            "message1": "はい %1",
            "args1": [
                {"type": "input_statement", "name": "DO"}
            ],
            "message2": "いいえ %1",
            "args2": [
                {"type": "input_statement", "name": "ELSE"}
            ],

            "previousStatement": null,
            "nextStatement": null,
            "colour": 120
            });
    },
    
    topID:-1,
    bottomID:-1,

    makecode:function(){
        var childs=[];
        Blockly.makecode_commonfunc(this);

        var doBlk=this.getInput('DO').connection.targetBlock();            
        var elseBlk=this.getInput('ELSE').connection.targetBlock();            

        //条件判定
        var cmp1blk = this.getInputTargetBlock('OPERAND 1');
        var cmp2blk = this.getInputTargetBlock('OPERAND 2');
        var op = CODE_MAP[this.getFieldValue('OPECODE')];
        
        BLOCKAREA.code += `${itohex(CODE_MAP.RC_C_INIT)}`;
        BLOCKAREA.code += `${itohex(CODE_MAP.RC_C_MR_B)}${itohex(cmp1blk.getFieldValue('FIELDNAME'))}`;      //オペランド1の変数または定数をスタックする
        if(cmp2blk.type=='constant') BLOCKAREA.code += `${itohex(CODE_MAP.RC_C_C_L)}${itohex(cmp2blk.getFieldValue('FIELDNAME'))}`;      //オペランド2の変数または定数をスタックする
        else BLOCKAREA.code += `${itohex(CODE_MAP.RC_C_MR_B)}${itohex(cmp2blk.getFieldValue('FIELDNAME'))}`;
        BLOCKAREA.code += `${itohex(op)}`;         //比較方法を実行
        BLOCKAREA.address += 6;

        //条件が成立していたらchildまでジャンプ
        var yesaddr = doBlk && BLOCKAREA.addressmap[doBlk.id]? BLOCKAREA.addressmap[doBlk.id].topID : this.bottomID;
        BLOCKAREA.code += `${itohex(CODE_MAP.RC_C_JUMP)}${itohex(yesaddr/256)}${itohex(yesaddr%256)}`;  
        BLOCKAREA.address += 3;

        //条件が成立していなかったらelseまでジャンプ
        var elseaddr = elseBlk && BLOCKAREA.addressmap[elseBlk.id]? BLOCKAREA.addressmap[elseBlk.id].topID : this.bottomID;
        BLOCKAREA.code += `${itohex(CODE_MAP.RC_JUMP)}${itohex(elseaddr/256)}${itohex(elseaddr%256)}`;  
        BLOCKAREA.address += 3;

        if(doBlk!=null) childs.push(doBlk);
        if(elseBlk!=null) childs.push(elseBlk);
        if(doBlk==null && elseBlk==null) this.makecode_bottom();
        return childs;
    },

    makecode_bottom:function(loop){
        if(loop==0){
            BLOCKAREA.code += `${itohex(CODE_MAP.RC_JUMP)}${itohex(this.bottomID/256)}${itohex(this.bottomID%256)}`;  
            BLOCKAREA.address += 3;
        }
        else this.bottomID = BLOCKAREA.address;
        Blockly.makecode_bottom(this);
    }

};



Blockly.Blocks['pro_calc'] = {
    init: function() {
        this.jsonInit({
            "message0": '"%1"  %2 "%3"',
            "previousStatement": null,
            "nextStatement": null,
            "tooltip": "変数演算",

            "args0": [
                {"type": "input_value", "name": "OPERAND 1", "check": "Number"},
                {"type": "field_dropdown", "name": "OPECODE", "options": [
                    [ "=", `RC_C_MW_B` ],
                    [ "+=", `RC_C_ADD` ],
                    [ "-=", `RC_C_SUB` ],
                    [ "*=", `RC_C_MUL` ],
                    [ "/=", `RC_C_DIV` ],
                    [ "%=", `RC_C_MOD` ],
                    [ "AND", `RC_C_AND` ],
                    [ "OR", `RC_C_OR` ],
                    [ "NOT", `RC_C_NOT` ],
                    [ "XOR", `RC_C_XOR` ],
                ]},
                {"type": "input_value", "name": "OPERAND 2", "check": "Number"}
              ],
            "colour": 36
        });
    },
    
    topID:-1,
    bottomID:-1,

    makecode:function(){
        Blockly.makecode_commonfunc(this);


        var cmp1blk = this.getInputTargetBlock('OPERAND 1');
        var cmp2blk = this.getInputTargetBlock('OPERAND 2');
        var op = CODE_MAP[this.getFieldValue('OPECODE')];
        
        if(op==CODE_MAP.RC_C_MW_B){
            BLOCKAREA.code += `${itohex(CODE_MAP.RC_C_INIT)}`;
            if(cmp2blk.type=='constant') BLOCKAREA.code += `${itohex(CODE_MAP.RC_C_C_L)}${itohex(cmp2blk.getFieldValue('FIELDNAME'))}`;      //オペランド2の変数または定数をスタックする
            else BLOCKAREA.code += `${itohex(CODE_MAP.RC_C_MR_B)}${itohex(cmp2blk.getFieldValue('FIELDNAME'))}`;
            BLOCKAREA.address += 3;

        }
        else{
            BLOCKAREA.code += `${itohex(CODE_MAP.RC_C_INIT)}`;
            BLOCKAREA.code += `${itohex(CODE_MAP.RC_C_MR_B)}${itohex(cmp1blk.getFieldValue('FIELDNAME'))}`;      //オペランド1の変数または定数をスタックする
            if(cmp2blk.type=='constant') BLOCKAREA.code += `${itohex(CODE_MAP.RC_C_C_L)}${itohex(cmp2blk.getFieldValue('FIELDNAME'))}`;      //オペランド2の変数または定数をスタックする
            else BLOCKAREA.code += `${itohex(CODE_MAP.RC_C_MR_B)}${itohex(cmp2blk.getFieldValue('FIELDNAME'))}`;
            BLOCKAREA.code += `${itohex(op)}`;         //比較方法を実行            
            BLOCKAREA.address += 6;
        }
        BLOCKAREA.code += `${itohex(CODE_MAP.RC_C_MW_B)}${itohex(cmp1blk.getFieldValue('FIELDNAME'))}`;
        BLOCKAREA.address += 2;

        this.bottomID = BLOCKAREA.address;
        Blockly.makecode_bottom(this);
    },

};

Blockly.Blocks['pro_loop_base'] = {
    init: function() {
        this.jsonInit({                   
            "message0": 'while (%1 %2 %3)',
            "previousStatement": null,
            "nextStatement": null,
            "tooltip": "wihle loop",
            "args0": [
                {"type": "input_value", "name": "OPERAND 1", "check": "Number"},
                {"type": "field_dropdown", "name": "OPECODE", "options": [
                    [ "==", `RC_C_EQ` ],
                    [ "!=", `RC_C_NE` ],
                    [ ">", `RC_C_GT` ],
                    [ ">=", `RC_C_GE` ],
                    [ "<", `RC_C_LT` ],
                    [ "<=", `RC_C_LE` ]
                ]},
                {"type": "input_value", "name": "OPERAND 2", "check": "Number"}
            ],
            "message1": "内容 %1",
            "args1": [
                {"type": "input_statement", "name": "DO"}
            ],
            "previousStatement": null,
            "nextStatement": null,
            "colour": 350
            });
    },
        
    topID:-1,
    bottomID:-1,

    makecode:function(){
        var childs=[];
        Blockly.makecode_commonfunc(this);

        var doBlk=this.getInput('DO').connection.targetBlock();            

        //条件判定
        var cmp1blk = this.getInputTargetBlock('OPERAND 1');
        var cmp2blk = this.getInputTargetBlock('OPERAND 2');
        var op = CODE_MAP[this.getFieldValue('OPECODE')];
        
        BLOCKAREA.code += `${itohex(CODE_MAP.RC_C_INIT)}`;
        BLOCKAREA.code += `${itohex(CODE_MAP.RC_C_MR_B)}${itohex(cmp1blk.getFieldValue('FIELDNAME'))}`;      //オペランド1の変数または定数をスタックする
        if(cmp2blk.type=='constant') BLOCKAREA.code += `${itohex(CODE_MAP.RC_C_C_L)}${itohex(cmp2blk.getFieldValue('FIELDNAME'))}`;      //オペランド2の変数または定数をスタックする
        else BLOCKAREA.code += `${itohex(CODE_MAP.RC_C_MR_B)}${itohex(cmp2blk.getFieldValue('FIELDNAME'))}`;
        BLOCKAREA.code += `${itohex(op)}`;         //比較方法を実行
        BLOCKAREA.address += 6;

        //条件が成立していたらchildまでジャンプ
        var yesaddr = doBlk && BLOCKAREA.addressmap[doBlk.id]? BLOCKAREA.addressmap[doBlk.id].topID : this.bottomID;
        BLOCKAREA.code += `${itohex(CODE_MAP.RC_C_JUMP)}${itohex(yesaddr/256)}${itohex(yesaddr%256)}`;  
        BLOCKAREA.address += 3;

        //条件が成立していなかったらbottomまでジャンプ
        BLOCKAREA.code += `${itohex(CODE_MAP.RC_JUMP)}${itohex(this.bottomID/256)}${itohex(this.bottomID%256)}`;  
        BLOCKAREA.address += 3;

        if(doBlk!=null) childs.push(doBlk);
        else this.makecode_bottom();
        return childs;
    },

    makecode_bottom:function(){
        BLOCKAREA.code += `${itohex(CODE_MAP.RC_JUMP)}${itohex(this.topID/256)}${itohex(this.topID%256)}`;
        BLOCKAREA.address += 3;
        this.bottomID = BLOCKAREA.address;
        Blockly.makecode_bottom(this);
    }


};


Blockly.Blocks['pro_break'] = {
    init: function() {
        this.jsonInit({
            "message0": 'break',
            "previousStatement": null,
            "colour": 20,
            "tooltip": "loop break",
        });
    },

    topID:-1,
    bottomID:-1,


    makecode:function(){
        Blockly.makecode_commonfunc(this);
        var loopparent = this.getParent();
        while(loopparent){
            if(loopparent.type=='pro_loop_base' || loopparent.type=='endlessloop_base' || loopparent.type=='loop_base') break;
            loopparent = loopparent.getParent();
        }

        if(loopparent){
            BLOCKAREA.code += `${itohex(CODE_MAP.RC_JUMP)}${itohex(loopparent.bottomID/256)}${itohex(loopparent.bottomID%256)}`;
            BLOCKAREA.address += 3;    
        }
        else{
            BLOCKAREA.code += BLOCKAREA.getEndCode();
            BLOCKAREA.address += BLOCKAREA.getEndCodeLength();
        }
        this.bottomID = BLOCKAREA.address;
        Blockly.makecode_bottom(this);
    }

    
};


Blockly.Blocks['pro_led_base'] ={

    init: function() {
        this.jsonInit({
            "message0": 'ライト%1 %2%% %3',
            "previousStatement": null,
            "nextStatement": null,
            "tooltip": "赤と緑のライトを指定の明るさで点灯させます。\n時間をくっつけると、その時間だけライトがつきます。\n時間をくっつけないと、つけっぱなしになります",
            "args0": [
                    {
                    "type": "field_colour",
                    "name": "LEDCOLOR",
                    "colour": Blockly.FieldColour.COLOURS[0]
                    },
                    {
                        "type": "field_number",
                        "name": "FIELDNAME",
                        "min": 0,
                        "max": 100,
                        "value": 50,
                        "precision": 1,
                        "width" : 100,
                        },
                    {
                    "type": "input_value",
                    "name": "VALUE",
                    "check": "Number"
                    }
            ],
            "colour": 60,
        });
    },
    
    topID:-1,
    bottomID:-1,

    makecode:function(){
        Blockly.makecode_commonfunc(this);

        var addr = MEMMAP_TBL.LED1_VAL +Blockly.FieldColour.COLOURS.indexOf(this.getFieldValue('LEDCOLOR'));

        var param = (this.getFieldValue('FIELDNAME')*255)/100;
        BLOCKAREA.code += `${itohex(CODE_MAP.RC_MEMW_B)}${itohex(addr)}01${itohex(param)}`;

        BLOCKAREA.address += 4;

        //時間指定があるか
        var inputBlk = this.getInputTargetBlock('VALUE');
        if(inputBlk){
            //指定時間待ち
            var waittime=inputBlk.getFieldValue('FIELDNAME') || 0;
            waittime*=1000;
            BLOCKAREA.code += `${itohex(CODE_MAP.RC_WAIT_W)}`;
            BLOCKAREA.code += `${itohex(waittime/256)}${itohex(waittime%256)}`;
    
            BLOCKAREA.address += 3;

            //時間待ち後LEDを消す
            BLOCKAREA.code += `${itohex(CODE_MAP.RC_MEMW_B)}${itohex(addr)}0100`;
            BLOCKAREA.address += 4;
        }
        this.bottomID = BLOCKAREA.address;
        Blockly.makecode_bottom(this);
    }

};

/*
Blockly.Blocks['pro_move_value'] = {
    init: function() {
        this.jsonInit({
            "message0": 'モータ 1%1 %% 2%2 %% %3',
            "previousStatement": null,
            "nextStatement": null,
            "tooltip": "モータを動かします。\n時間をくっつけると、その時間だけ動きます。\n時間をくっつけないと、動きっぱなしになります。",
            "args0": [
                {
                    "type": "field_number",
                    "name": "lspd",
                    "min": -100,
                    "max": 100,
                    "value": 50,
                    "precision": 1,
                    "width" : 100,
                },
                {
                    "type": "field_number",
                    "name": "rspd",
                    "min": -100,
                    "max": 100,
                    "value": 50,
                    "precision": 1,
                    "width" : 100,
                },
                {
                    "type": "input_value",
                    "name": "VALUE",
                    "check": "Number"
                    }
                ],
            "colour": 210,
        });
    },
    
    topID:-1,
    bottomID:-1,

    makecode:function(){
        Blockly.makecode_commonfunc(this);

        var lspd = this.getFieldValue('lspd')/100*127;
        var rspd = this.getFieldValue('rspd')/100*127;
        BLOCKAREA.code += `${itohex(CODE_MAP.RC_MEMW_B)}${itohex(MEMMAP_TBL.LED1_VAL)}02${itohex(lspd)}${itohex(rspd)}`;

        BLOCKAREA.address += 5;

        //時間指定があるか
        var inputBlk = this.getInputTargetBlock('VALUE');
        if(inputBlk){
            //指定時間待ち
            var waittime=inputBlk.getFieldValue('FIELDNAME') || 0;
            waittime*=1000;
            BLOCKAREA.code += `${itohex(CODE_MAP.RC_WAIT_W)}`;
            BLOCKAREA.code += `${itohex(waittime/256)}${itohex(waittime%256)}`;
    
            BLOCKAREA.address += 3;

            //時間待ち後モータを止める
            BLOCKAREA.code += `${itohex(CODE_MAP.RC_MEMW_B)}${itohex(MEMMAP_TBL.LED1_VAL)}020000`;
            BLOCKAREA.address += 5;
        }
        this.bottomID = BLOCKAREA.address;
        Blockly.makecode_bottom(this);
    }

};
*/
