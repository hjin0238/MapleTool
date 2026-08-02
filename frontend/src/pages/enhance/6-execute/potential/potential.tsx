import {
  Badge,
  Button,
  Checkbox, // ← 추가
  Divider,
  Flex,
  Image,
  Stack,
  Tag,
  Text,
  useColorMode,
  useDisclosure,
} from "@chakra-ui/react";
import PotentialConditionSet from "../../../../types/character/itemEquipment/potential/potentialConditionSet";
import {
  MATERIAL_INFOS,
  MATERIAL_TYPE,
} from "../../../../constants/enhance/material";
import { useAppDispatch, useAppSelector } from "../../../../stores/hooks";
import OptionsButton from "../common/optionButton";
import { useEffect, useRef, useState } from "react";
import {
  MAX_POTENTIALS,
  POTENTIAL_CRITERIA,
  POTENTIAL_GRADE,
  POTENTIAL_INFOS,
} from "../../../../constants/enhance/potential";
import {
  calcRollingMaterials,
  formatOptions,
  getOptions,
  isAddi,
  isSelectable,
  nextPotential,
  parseGrade,
} from "../../../../services/enhance/potential";
import {
  addMaterials,
  setGuarantee,
  setInventoryPotential,
} from "../../../../stores/userSlice";
import { formatNumber } from "../../../../utils/formatter";
import MESO from "../../../../assets/item/meso/coin.png";
import { usePotentialQuery } from "../../../../stores/characterApi";
import {
  useInfoToast,
  useSuccessToast,
  useWarningToast,
} from "../../../../hooks/useToast";
import PotentialResponse from "../../../../types/character/itemEquipment/potential/potentialResponse";
import AutoModal from "./autoModal";
import PotentialCondition from "../../../../types/character/itemEquipment/potential/potentialCondition";
import { FaPlay, FaStop } from "react-icons/fa6";
import { isFitConditions } from "../../../../services/enhance/potentialCondition";
import ItemSlot from "../common/itemSlot";
import Guarantee from "./guarantee";

const AUTO_DELAY = 100;

export default function Potential({
  inventoryIndex,
  materialType,
}: {
  inventoryIndex: number;
  materialType: MATERIAL_TYPE;
}) {
  const dark = useColorMode().colorMode == "dark";
  const toastWarning = useWarningToast();
  const toastSuccess = useSuccessToast();
  const toastInfo = useInfoToast();

  const dispatch = useAppDispatch();
  const inventory = useAppSelector((state) => state.user.inventory);
  const inventoryRef = useRef(inventory);
  const guarantees = useAppSelector((state) => state.user.guarantees);
  const guaranteesRef = useRef(guarantees);
  const materialLimitEnabled = useAppSelector(
    (state) => state.user.materialLimitEnabled,
  );
  const materialLimitEnabledRef = useRef(materialLimitEnabled);
  const materialLimits = useAppSelector((state) => state.user.materialLimits);
  const materialLimitsRef = useRef(materialLimits);

  const [newGrade, setNewGrade] = useState<POTENTIAL_GRADE>();
  const [newOptions, setNewOptions] = useState<PotentialResponse[]>([]);
  const newOptionsRef = useRef(newOptions);
  const [conditionGrid, setConditionGrid] = useState<PotentialConditionSet[]>(
    [],
  );
  const [intervalId, setIntervalId] = useState<number>();
  const [doubleUpgrade, setDoubleUpgrade] = useState(false);
  const doubleUpgradeRef = useRef(doubleUpgrade);
  const [pityStopEnabled, setPityStopEnabled] = useState<
    Partial<Record<POTENTIAL_GRADE, boolean>>
  >({});
  const pityStopEnabledRef = useRef(pityStopEnabled);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const item = inventory[inventoryIndex].after;
  const addi = isAddi(materialType);
  const selectable = isSelectable(materialType);
  const options = getOptions(item, addi);
  const optionsRef = useRef(options);

  const level = item.item_base_option.base_equipment_level;
  const grade = parseGrade(
    addi ? item.additional_potential_option_grade : item.potential_option_grade,
  );
  const gradeRef = useRef(grade);
  const costMaterials = calcRollingMaterials(materialType, level, addi, grade);
  const costMaterialsRef = useRef(costMaterials);

  const { data, isFetching } = usePotentialQuery({
    type: MATERIAL_INFOS[materialType].type,
    part: item.item_equipment_part,
    level,
  });

  useEffect(
    () => () => clearInterval(intervalId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);
  useEffect(() => {
    newOptionsRef.current = newOptions;
  }, [newOptions]);
  useEffect(() => {
    gradeRef.current = grade;
  }, [grade]);
  useEffect(() => {
    guaranteesRef.current = guarantees;
  }, [guarantees]);
  useEffect(() => {
    inventoryRef.current = inventory;
  }, [inventory]);
  useEffect(() => {
    materialLimitEnabledRef.current = materialLimitEnabled;
  }, [materialLimitEnabled]);
  useEffect(() => {
    materialLimitsRef.current = materialLimits;
  }, [materialLimits]);
  useEffect(() => {
    costMaterialsRef.current = costMaterials;
  }, [costMaterials]);
  useEffect(() => {
    doubleUpgradeRef.current = doubleUpgrade;
  }, [doubleUpgrade]);
  useEffect(() => {
    pityStopEnabledRef.current = pityStopEnabled;
  }, [pityStopEnabled]);

  useEffect(() => {
    clearNewOptions();
    //setConditionGrid([]); //자동설정 옵션세트 없애는거
    if (intervalId) {
      setIntervalId(undefined);
      clearInterval(intervalId);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inventoryIndex, materialType]);

  const clearNewOptions = () => {
    setNewGrade(undefined);
    setNewOptions([]);
  };
  const isLimitReached = () => {
    if (!materialLimitEnabledRef.current) return false;

    const totals = new Map<string, number>();
    inventoryRef.current.forEach((invItem) => {
      invItem.used.forEach(({ name, value }) => {
        totals.set(name, (totals.get(name) ?? 0) + value);
      });
    });

    return Array.from(totals.entries()).some(
      ([name, value]) =>
        materialLimitsRef.current[name] > 0 &&
        value >= materialLimitsRef.current[name],
    );
  };
  const applyOptions = (
    options: PotentialResponse[],
    grade?: POTENTIAL_GRADE,
  ) => {
    dispatch(
      setInventoryPotential({
        index: inventoryIndex,
        addi,
        grade: grade ? POTENTIAL_INFOS[grade].name : "",
        options: formatOptions(options),
      }),
    );
    clearNewOptions();
  };
  const rollPotential = () => {
    if (!data) return;

    const grade = gradeRef.current;
    const costMaterials = costMaterialsRef.current;
    const options = selectable
      ? newOptionsRef.current.map((option) =>
          option.name.replace("n", option.value.toString()),
        )
      : optionsRef.current;
    const guarantee =
      grade && guaranteesRef.current[materialType]
        ? (guaranteesRef.current[materialType][grade] ?? 0)
        : 0;
    const newPotential = nextPotential(
      data,
      options,
      materialType,
      grade,
      guarantee,
      doubleUpgradeRef.current,
    );

    let pityTriggered = false;
    if (grade && POTENTIAL_CRITERIA[materialType]) {
      const bound = POTENTIAL_CRITERIA[materialType][grade].bound;
      if (bound > 0) {
        pityTriggered = guarantee == bound - 1;
        dispatch(
          setGuarantee({
            type: materialType,
            grade,
            value: newPotential.grade == grade ? guarantee + 1 : 0,
          }),
        );
      }
    }
    dispatch(addMaterials({ index: inventoryIndex, materials: costMaterials }));

    return { ...newPotential, pityTriggered, pityGrade: grade };
  };

  const rollAndApplyPotential = () => {
    const newPotential = rollPotential();
    if (!newPotential) return;

    if (selectable) {
      setNewGrade(newPotential.grade);
      setNewOptions(newPotential.options);
      return newPotential;
    }

    applyOptions(newPotential.options, newPotential.grade);
    return newPotential;
  };
  const onExecuteButtonClick = () => {
    if (!data?.length) {
      toastWarning({ title: "해당 아이템에 대한 잠재능력 정보가 없습니다." });
      return;
    }

    if (isLimitReached()) {
      toastWarning({ title: "재료 사용 제한에 도달했습니다." });
      return;
    }

    if (conditionGrid.length) {
      if (intervalId) {
        toastInfo({ title: "자동 재설정 중지" });
        setIntervalId(undefined);
        clearInterval(intervalId);
        return;
      }

      const startIntervalId = setInterval(() => {
        if (isLimitReached()) {
          toastWarning({ title: "재료 사용 제한으로 자동 재설정 중단" });
          setIntervalId(undefined);
          clearInterval(startIntervalId);
          return;
        }

        const newPotential = rollAndApplyPotential();
        if (!newPotential) return;

        if (
          newPotential.pityGrade &&
          pityStopEnabledRef.current[newPotential.pityGrade] &&
          newPotential.pityTriggered
        ) {
          toastInfo({ title: "천장 도달로 자동 재설정 중단" });
          setIntervalId(undefined);
          clearInterval(startIntervalId);
          return;
        }

        if (
          isFitConditions(
            conditionGrid,
            newPotential.options,
            newPotential.grade,
          )
        ) {
          toastSuccess({ title: "자동 재설정 성공" });
          setIntervalId(undefined);
          clearInterval(startIntervalId);
          return;
        }

        if (gradeRef.current != newPotential.grade)
          applyOptions(newPotential.options, newPotential.grade);
      }, AUTO_DELAY);
      setIntervalId(startIntervalId);
      toastInfo({ title: "자동 재설정 시작" });
      return;
    }

    rollAndApplyPotential();
  };

  return (
    <Stack width={{ base: "100%", md: 60 }}>
      {(POTENTIAL_CRITERIA[materialType]?.RARE.bound ?? 0) > 0 && (
        <>
          <Guarantee materialType={materialType} />
          <Divider my={1} />
        </>
      )}
      <Checkbox
        size="sm"
        isChecked={doubleUpgrade}
        onChange={(e) => setDoubleUpgrade(e.target.checked)}
      >
        미라클
      </Checkbox>

      <Stack spacing={1}>
        <Text fontSize="sm">천장 도달 시 정지</Text>
        <Flex gap={3} wrap="wrap">
          {(
            [
              POTENTIAL_GRADE.RARE,
              POTENTIAL_GRADE.EPIC,
              POTENTIAL_GRADE.UNIQUE,
            ] as const
          ).map((g) => {
            const bound = POTENTIAL_CRITERIA[materialType]?.[g]?.bound ?? -1;
            if (bound <= 0) return null;

            const grades = Object.values(POTENTIAL_GRADE);
            const nextGradeName =
              POTENTIAL_INFOS[grades[grades.indexOf(g) + 1]].name;

            return (
              <Checkbox
                key={"pity-" + g}
                size="sm"
                isChecked={pityStopEnabled[g] ?? false}
                onChange={(e) =>
                  setPityStopEnabled((prev) => ({
                    ...prev,
                    [g]: e.target.checked,
                  }))
                }
              >
                {nextGradeName}
              </Checkbox>
            );
          })}
        </Flex>
      </Stack>

      <Tag as={Flex} px={2} py={1} gap={2}>
        <Image src={MATERIAL_INFOS[materialType].icon} />
        <Text size="xs">
          아이템의 <b>{addi ? "에디셔널 " : ""}잠재능력</b>을 재설정합니다.
        </Text>
      </Tag>
      <ItemSlot image={item?.item_icon} />

      <OptionsButton
        title={selectable ? "BEFORE" : "RESULT"}
        grade={grade}
        options={options}
        borderColor={grade ? POTENTIAL_INFOS[grade].borderColor : ""}
        maxOptionCount={MAX_POTENTIALS}
        isDisabled={!options[0]}
        onClick={selectable ? clearNewOptions : undefined}
      />
      {selectable && (
        <OptionsButton
          title="AFTER"
          grade={newGrade}
          options={formatOptions(newOptions)}
          isDisabled={!newOptions[0]}
          borderColor={newGrade ? POTENTIAL_INFOS[newGrade].borderColor : ""}
          maxOptionCount={MAX_POTENTIALS}
          onClick={
            selectable ? () => applyOptions(newOptions, newGrade) : undefined
          }
        />
      )}
      <Flex
        justifyContent="space-between"
        align="center"
        bgColor={dark ? "gray.900" : "gray.50"}
        px={2}
        borderRadius={8}
      >
        <Image src={MESO} />
        <Text fontSize={12}>
          {formatNumber(
            costMaterials.find(({ name }) => name.startsWith("메소"))?.value ??
              0,
          )}
          &nbsp;메소
        </Text>
      </Flex>
      <Flex gap={2}>
        <Button
          size="xs"
          colorScheme={conditionGrid.length ? "blue" : undefined}
          onClick={onOpen}
        >
          자동설정
        </Button>
        <Button
          flex={1}
          size="xs"
          isDisabled={
            !item ||
            (selectable && newGrade && grade != newGrade) ||
            isLimitReached()
          }
          isLoading={isFetching}
          loadingText="데이터 요청중"
          colorScheme={intervalId ? "red" : undefined}
          leftIcon={
            !conditionGrid.length ? undefined : intervalId ? (
              <FaStop />
            ) : (
              <FaPlay />
            )
          }
          onClick={onExecuteButtonClick}
        >
          {!conditionGrid.length
            ? "재설정하기"
            : intervalId
              ? "재설정 중지"
              : "재설정 시작"}
        </Button>
      </Flex>
      {conditionGrid.map((set, i) => (
        <Flex key={"conditions-" + i} gap={2}>
          <Badge size="xs" colorScheme="blue">
            {i + 1}
          </Badge>
          <Flex gap={2} wrap="wrap">
            {set.targetGrade && (
              <Tag
                size="xs"
                px={1}
                py={0.5}
                bgColor={POTENTIAL_INFOS[set.targetGrade].imageColor}
                color={POTENTIAL_INFOS[set.targetGrade].textColor}
                fontSize="var(--chakra-fontSizes-xs)"
              >
                {POTENTIAL_INFOS[set.targetGrade].name}
              </Tag>
            )}
            {set.conditions.map((condition, j) => (
              <Tag
                key={"condition-" + j}
                size="xs"
                px={1}
                py={0.5}
                fontSize="var(--chakra-fontSizes-xs)"
              >
                {condition.name.replace("n", condition.value.toString())}
              </Tag>
            ))}
          </Flex>
        </Flex>
      ))}
      <AutoModal
        isOpen={isOpen}
        onClose={onClose}
        grade={grade ?? POTENTIAL_GRADE.RARE}
        potentialInfos={data ?? []}
        conditionGrid={conditionGrid}
        setConditionGrid={setConditionGrid}
      />
    </Stack>
  );
}
