
import { UGCStruct } from "./types";

// The "Initial Data" file (Target File)
export const SAMPLE_TARGET_JSON: UGCStruct = {
  "structId": "1077936133",
  "type": "Struct",
  "value": [
      { "key": "随从数据列表", "param_type": "StructList", "value": { "structId": "1077936130", "value": [] } },
      { "key": "随从元件-配置id映射", "param_type": "Dict", "value": { "type": "Dict", "key_type": "EntityReference", "value_type": "ConfigReference", "value": [] } },
      { "key": "随从配置id-元件映射", "param_type": "Dict", "value": { "type": "Dict", "key_type": "ConfigReference", "value_type": "EntityReference", "value": [] } },
      { "key": "随从元件-名称映射", "param_type": "Dict", "value": { "type": "Dict", "key_type": "EntityReference", "value_type": "String", "value": [] } },
      { "key": "随从元件-买入价格映射", "param_type": "Dict", "value": { "type": "Dict", "key_type": "EntityReference", "value_type": "Float", "value": [] } },
      { "key": "随从元件-卖出价格映射", "param_type": "Dict", "value": { "type": "Dict", "key_type": "EntityReference", "value_type": "Float", "value": [] } },
      { "key": "随从元件-序号映射", "param_type": "Dict", "value": { "type": "Dict", "key_type": "EntityReference", "value_type": "Int32", "value": [] } },
      { "key": "随从配置id-序号映射", "param_type": "Dict", "value": { "type": "Dict", "key_type": "ConfigReference", "value_type": "Int32", "value": [] } }
  ],
  "basic_struct_id": "ec8719d7",
  "name": "初始数据.json"
};

// The Definition of the item inside the StructList
export const SAMPLE_STRUCT_DEF_1077936130: UGCStruct = {
    "structId": "1077936130",
    "type": "Struct",
    "name": "随从基础结构",
    "value": [
        { "key": "名称", "param_type": "String", "value": "" },
        { "key": "元件ID", "param_type": "EntityReference", "value": "0" },
        { "key": "配置ID", "param_type": "ConfigReference", "value": "0" }
    ]
};

export const SAMPLE_TABLE_DATA = `元件ID\t配置ID\t名称\t价格
1082130436\t1107296257\t火史莱姆\t50
1082130437\t1107296258\t大型火史莱姆\t75
1082130438\t1107296260\t水史莱姆\t50
1082130439\t1107296261\t大型水史莱姆\t75
1082130440\t1107296262\t风史莱姆\t50`;
