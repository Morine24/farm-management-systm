import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { X, Sprout } from 'lucide-react';

interface FarmHierarchyChartProps {
  farm: any;
  onClose: () => void;
}

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#9ca3af'];

const FarmHierarchyChart: React.FC<FarmHierarchyChartProps> = ({ farm, onClose }) => {
  const [hierarchyData, setHierarchyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHierarchy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [farm.id]);

  const loadHierarchy = async () => {
    try {
      const sectionsSnap = await getDocs(query(collection(db, 'sections'), where('farmId', '==', farm.id)));
      const sections = sectionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));

      const children = [];
      let totalUsedArea = 0;
      
      // Fetch all blocks and beds in parallel
      const sectionIds = sections.map(s => s.id);
      const blocksPromises = sectionIds.map(id => getDocs(query(collection(db, 'blocks'), where('sectionId', '==', id))));
      const allBlocksSnaps = await Promise.all(blocksPromises);
      
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        const blocks = allBlocksSnaps[i].docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
        
        let totalBeds = 0;
        let totalDriplines = 0;
        const blockChildren = [];
        
        // Fetch all beds for this section's blocks in parallel
        const blockIds = blocks.map(b => b.id);
        const bedsPromises = blockIds.map(id => getDocs(query(collection(db, 'beds'), where('blockId', '==', id))));
        const allBedsSnaps = await Promise.all(bedsPromises);
        
        for (let j = 0; j < blocks.length; j++) {
          const block = blocks[j];
          const bedsSnap = allBedsSnaps[j];
          totalBeds += bedsSnap.size;
          const beds = bedsSnap.docs.map(doc => doc.data() as any);
          const blockDriplines = beds.reduce((sum, bed) => sum + (bed.driplinesCount || 0), 0);
          totalDriplines += blockDriplines;
          
          blockChildren.push({
            name: block.name,
            size: bedsSnap.size || 1,
            beds: bedsSnap.size,
            driplines: blockDriplines,
            cropType: block.cropType
          });
        }
        
        totalUsedArea += section.area;
        const sectionPercentage = ((section.area / farm.area) * 100).toFixed(1);
        
        children.push({
          name: section.name,
          percentage: sectionPercentage,
          size: section.area,
          type: 'section',
          blocks: blocks.length,
          beds: totalBeds,
          driplines: totalDriplines,
          cropType: blocks[0]?.cropType || 'Mixed',
          children: blockChildren
        });
      }

      const idleArea = farm.area - totalUsedArea;
      if (idleArea > 0) {
        const idlePercentage = ((idleArea / farm.area) * 100).toFixed(1);
        children.push({
          name: `Idle Area (${idlePercentage}%)`,
          size: idleArea,
          type: 'idle'
        });
      }

      setHierarchyData([{ name: farm.name, children }]);
      setLoading(false);
    } catch (error) {
      console.error('Error loading hierarchy:', error);
      setLoading(false);
    }
  };

  const [hoveredSection, setHoveredSection] = useState<any>(null);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="p-3 sm:p-6">
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <div>
              <h2 className="text-lg sm:text-2xl font-bold">{farm.name} - Farm Structure</h2>
              <p className="text-sm sm:text-base text-gray-600">Total Area: {farm.area} acres (100%)</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-48 sm:h-96">
              <p className="text-sm sm:text-base text-gray-500">Loading farm structure...</p>
            </div>
          ) : hierarchyData.length === 0 ? (
            <div className="flex justify-center items-center h-48 sm:h-96">
              <p className="text-sm sm:text-base text-gray-500">No sections found for this farm</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto pb-4">
                <div className="inline-block min-w-full">
                  {/* Farm Root */}
                  <div className="flex flex-col items-center">
                    <div className="bg-green-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg shadow-lg mb-4 sm:mb-8">
                      <div className="font-bold text-sm sm:text-lg">{farm.name}</div>
                      <div className="text-xs sm:text-sm">Total: {farm.area} acres (100%)</div>
                    </div>
                    
                    {/* Sections Level */}
                    <div className="flex gap-3 sm:gap-8 justify-center flex-wrap">
                      {hierarchyData[0]?.children?.map((section: any, index: number) => {
                        const sectionLabel = String.fromCharCode(65 + index); // A, B, C, etc.
                        return (
                        <div key={index} className="flex flex-col items-center">
                          {/* Line from farm to section */}
                          <div className="w-0.5 h-4 sm:h-8 bg-gray-400"></div>
                          
                          {/* Section Node */}
                          <div
                            className="px-3 sm:px-4 py-2 sm:py-3 rounded-lg shadow-md cursor-pointer transition-transform hover:scale-105 max-w-[140px] sm:max-w-none"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            onMouseEnter={() => setHoveredSection(section)}
                            onMouseLeave={() => setHoveredSection(null)}
                            onClick={() => setHoveredSection(hoveredSection?.name === section.name ? null : section)}
                          >
                            <div className="text-white font-semibold text-xs sm:text-sm">Section {section.name}</div>
                            {section.type === 'section' && (
                              <div className="text-white text-[10px] sm:text-xs mt-1">
                                <div>{section.percentage}%</div>
                                <div>{section.size} acres</div>
                                <div className="hidden sm:block">{section.blocks} blocks, {section.beds} beds</div>
                                <div className="sm:hidden">{section.blocks}b, {section.beds}bd</div>
                              </div>
                            )}
                          </div>
                          
                          {/* Blocks Level */}
                          {section.children && section.children.length > 0 && (
                            <>
                              <div className="w-0.5 h-3 sm:h-6 bg-gray-300"></div>
                              <div className="flex gap-2 sm:gap-3 flex-wrap justify-center max-w-[160px] sm:max-w-none">
                                {section.children.map((block: any, bIndex: number) => (
                                  <div key={bIndex} className="flex flex-col items-center">
                                    <div className="w-0.5 h-2 sm:h-4 bg-gray-300"></div>
                                    <div className="bg-white border-2 px-2 sm:px-3 py-1 sm:py-2 rounded shadow-sm text-[10px] sm:text-xs" style={{ borderColor: COLORS[index % COLORS.length] }}>
                                      <div className="font-medium">Block {block.name}</div>
                                      <div className="text-gray-600">{block.beds} beds</div>
                                      {block.cropType && <div className="text-green-600 font-medium flex items-center gap-1"><Sprout className="h-3 w-3" /> {block.cropType}</div>}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      );})}
                    </div>
                  </div>
                </div>
                
                {/* Hover/Click tooltip */}
                {hoveredSection && hoveredSection.type === 'section' && (
                  <div className="mt-4 sm:mt-6 bg-blue-50 p-3 sm:p-4 rounded border border-blue-200">
                    <p className="font-semibold text-sm sm:text-base text-blue-900">Section {String.fromCharCode(65 + hierarchyData[0]?.children?.indexOf(hoveredSection))} - {hoveredSection.name}</p>
                    <div className="text-xs sm:text-sm text-blue-800 mt-2 grid grid-cols-2 gap-2">
                      <div>Area: {hoveredSection.size} acres</div>
                      <div>Blocks: {hoveredSection.blocks}</div>
                      <div>Beds: {hoveredSection.beds}</div>
                      <div>Driplines: {hoveredSection.driplines}</div>
                      <div className="col-span-2">Crop: {hoveredSection.cropType}</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 sm:mt-6">
                <h3 className="font-semibold text-sm sm:text-base mb-3">Section Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {hierarchyData[0]?.children?.map((section: any, index: number) => (
                    <div key={index} className="p-3 sm:p-4 border rounded-lg" style={{ borderLeftColor: COLORS[index % COLORS.length], borderLeftWidth: '4px' }}>
                      <h4 className="font-medium text-sm sm:text-base">Section {String.fromCharCode(65 + index)} - {section.name}</h4>
                      <div className="text-xs sm:text-sm text-gray-600 mt-2">
                        <p>Area: {section.size} acres</p>
                        {section.type === 'section' && (
                          <>
                            <p>Blocks: {section.blocks}</p>
                            <p>Beds: {section.beds}</p>
                            <p>Driplines: {section.driplines}</p>
                            <p>Crop Type: {section.cropType}</p>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FarmHierarchyChart;
