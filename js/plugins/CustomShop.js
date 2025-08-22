/*:
 * @plugindesc 커스텀 상점 기능 플러그인 - 재고 제한, 구매 1회 제한, 공통 이벤트 실행 지원 v1.0
 * @command OpenCustomShop
 * @text 커스텀 상점 열기
 * @desc 커스텀 상점을 오픈합니다.
 *
 * @arg ItemId
 * @text 아이템 ID
 * @type number
 * @min 1
 * @desc 판매할 아이템의 데이터베이스 ID입니다.

 * @arg Price
 * @text 가격
 * @type number
 * @min 0
 * @desc 아이템 가격 (골드)

 * @arg Capacity
 * @text 최대 소지 가능 수
 * @type number
 * @min 1
 * @default 1
 * @desc 이 수량 이상 소지하면 구매 불가

 * @arg BuySwitchId
 * @text 구매 여부 저장용 스위치
 * @type switch
 * @desc 이 스위치가 ON이면 구매 불가

 * @arg CommonEventId
 * @text 구매 시 실행할 공통 이벤트
 * @type common_event
 * @default 0
 * @desc 구매 시 실행할 공통 이벤트 ID (0이면 실행 안함)
 *
 * @author ChatGPT
 *
 * @help
 * 이 플러그인은 커스텀 상점을 열 수 있게 합니다.
 * RPG Maker MZ에서 이벤트 명령으로 커맨드 플러그인을 실행하세요.
 * 
 * 조건:
 * - 지정한 아이템 ID, 가격, 소지 제한(capacity), 구매 기록 스위치, 공통 이벤트 설정 가능
 * - 조건을 만족할 때만 구매 가능
 * - 구매 시 아이템 지급 + 스위치 ON + 공통 이벤트 실행
 */

(() => {
    PluginManager.registerCommand("ShopOptions", "OpenCustomShop", args => {
        const itemId = Number(args.ItemId);
        const price = Number(args.Price);
        const cap = Number(args.Capacity);
        const switchId = Number(args.BuySwitchId);
        const commonEventId = Number(args.CommonEventId);
        const item = $dataItems[itemId];

        if (!item) {
            console.warn("[ShopOptions] 잘못된 아이템 ID:", itemId);
            return;
        }

        // 이미 구매한 경우
        if ($gameSwitches.value(switchId)) {
            $gameMessage.add("이미 구매한 상품입니다.");
            return;
        }

        // 가격 확인
        if ($gameParty.gold() < price) {
            $gameMessage.add("소지금이 부족합니다.");
            return;
        }

        // 수량 확인
        if ($gameParty.numItems(item) >= cap) {
            $gameMessage.add("더 이상 구매할 수 없습니다.");
            return;
        }

        // 구매 처리
        $gameParty.loseGold(price);
        $gameParty.gainItem(item, 1);
        $gameSwitches.setValue(switchId, true);
        $gameMessage.add(item.name + "을(를) 구입했습니다!");

        if (commonEventId > 0) {
            $gameTemp.reserveCommonEvent(commonEventId);
        }
    });
})();
