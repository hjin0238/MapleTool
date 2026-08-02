import {
  Flex,
  Input,
  Image,
  Stack,
  Switch,
  Tag,
  Text,
  Tooltip,
  useColorMode,
} from "@chakra-ui/react";
import { useAppDispatch, useAppSelector } from "../../../stores/hooks";
import { AnimatedCounter } from "react-animated-counter";
import { getMaterialIcon } from "../../../utils/icon";
import RequiredText from "../../../components/content/requiredText";
import {
  setMaterialLimit,
  setMaterialLimitEnabled,
} from "../../../stores/userSlice";

export default function UsedMaterialTotal() {
  const dispatch = useAppDispatch();
  const inventory = useAppSelector((state) => state.user.inventory);
  const limitEnabled = useAppSelector(
    (state) => state.user.materialLimitEnabled,
  );
  const limits = useAppSelector((state) => state.user.materialLimits);

  const dark = useColorMode().colorMode == "dark";
  const color = dark ? "white" : "black";

  const totals = new Map<string, number>();
  inventory.forEach((item) => {
    item.used.forEach(({ name, value }) => {
      totals.set(name, (totals.get(name) ?? 0) + value);
    });
  });
  const totalList = Array.from(totals.entries()).map(([name, value]) => ({
    name,
    value,
  }));

  const onLimitChange = (name: string, raw: string) => {
    const num = Number(raw.replace(/,/g, ""));
    dispatch(setMaterialLimit({ name, limit: isNaN(num) ? 0 : num }));
  };

  return (
    <Stack pt={2}>
      <Flex align="center" gap={2}>
        <Switch
          size="sm"
          isChecked={limitEnabled}
          onChange={(e) => dispatch(setMaterialLimitEnabled(e.target.checked))}
        />
        <Text fontSize="sm">재료 사용 제한</Text>
      </Flex>

      {!totalList.length ? (
        <Flex justify="center" pt="1px">
          <RequiredText>사용한 재료가 없습니다.</RequiredText>
        </Flex>
      ) : (
        <Flex gap={2} justify={{ base: "center", md: "start" }} wrap="wrap">
          {totalList.map(({ name, value }) => {
            const limit = limits[name] ?? 0;
            const exceeded = limitEnabled && limit > 0 && value >= limit;

            return (
              <Tooltip key={"total-material-" + name} label={name}>
                <Tag
                  position="relative"
                  pt={2}
                  pb={1}
                  borderColor={exceeded ? "red.400" : undefined}
                  borderWidth={exceeded ? 2 : undefined}
                  bgColor={exceeded ? "red.50" : undefined}
                >
                  <Stack align="center">
                    <Flex
                      position="relative"
                      h={8}
                      justify="center"
                      align="end"
                    >
                      <Image src={getMaterialIcon(name)} />
                      {name.startsWith("메소") && (
                        <Image
                          h={4}
                          src={getMaterialIcon(name.replace("메소 - ", ""))}
                        />
                      )}
                    </Flex>
                    <AnimatedCounter
                      includeDecimals={false}
                      includeCommas
                      fontSize="12px"
                      decrementColor={exceeded ? "red" : color}
                      incrementColor={exceeded ? "red" : color}
                      color={exceeded ? "red" : color}
                      value={value}
                      containerStyles={{ paddingBottom: "1px" }}
                    />
                    {limitEnabled && (
                      <Input
                        size="xs"
                        minwidth="70px"
                        width="auto"
                        placeholder="제한"
                        textAlign="center"
                        value={
                          limits[name] ? limits[name].toLocaleString() : ""
                        }
                        onChange={(e) => onLimitChange(name, e.target.value)}
                      />
                    )}
                  </Stack>
                </Tag>
              </Tooltip>
            );
          })}
        </Flex>
      )}
    </Stack>
  );
}
