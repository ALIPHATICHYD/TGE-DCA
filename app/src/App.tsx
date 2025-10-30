import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import { Box, Container, Flex, Heading } from "@radix-ui/themes";
import { CreateVault } from "./components/CreateVault";
import { VaultList } from "./components/VaultList";

function App() {
  const account = useCurrentAccount();

  return (
    <>
      <Flex
        position="sticky"
        px="4"
        py="2"
        justify="between"
        style={{
          borderBottom: "1px solid var(--gray-a2)",
        }}
      >
        <Box>
          <Heading>TGE DeFi - DCA Vault</Heading>
        </Box>

        <Box>
          <ConnectButton />
        </Box>
      </Flex>
      <Container>
        <Container
          mt="5"
          pt="2"
          px="4"
          style={{ background: "var(--gray-a2)", minHeight: 500 }}
        >
          {!account ? (
            <Box style={{ textAlign: "center", padding: "32px 0" }}>
              <Heading size="4" mb="4">
                Welcome to TGE DeFi DCA Vault
              </Heading>
              <Box style={{ color: "var(--gray-11)" }}>
                Connect your wallet to create and manage DCA vaults
              </Box>
            </Box>
          ) : (
            <Flex direction="column" gap="6">
              <CreateVault />
              <VaultList />
            </Flex>
          )}
        </Container>
      </Container>
    </>
  );
}

export default App;
