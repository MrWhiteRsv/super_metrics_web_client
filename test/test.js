function testAll() {
	utils.assert(testBeacons()); 
  utils.assert(testRevolutionPath());
  utils.assert(testLearnDistance());
  utils.assert(testBeaconsGraph());
}
